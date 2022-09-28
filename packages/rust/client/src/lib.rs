pub mod error;
pub mod keys;

#[cfg(test)]
mod test;

use error::{Result, VulpoError};

use chrono::Utc;
use dirs;
use keys::KeyPair;
use reqwest;
use serde::{Deserialize, Serialize};
use std::fs;
use std::fs::File;
use std::io::Write;
use std::io::{self, Read};
use std::path::PathBuf;
use uuid::Uuid;

pub use vulpo_auth_types::api_key::{ApiKeyResponse, GenerateApiKeyPayload as GenerateApiKey};
pub use vulpo_auth_types::error::Message;
pub use vulpo_auth_types::session::{RefreshAccessToken, SessionResponse};
pub use vulpo_auth_types::{SignInPayload, User};

pub struct AuthClient {
    base_url: String,
    http_client: reqwest::Client,
    storage_service: StorageService,
}

impl AuthClient {
    pub fn new(project_id: &str, base_url: &str) -> AuthClient {
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            "Vulpo-Project",
            reqwest::header::HeaderValue::from_str(&project_id).unwrap(),
        );

        let http_client = reqwest::Client::builder()
            .default_headers(headers)
            .build()
            .expect("http client");

        let storage_service = StorageService::new(&project_id);

        AuthClient {
            base_url: base_url.to_string(),
            http_client,
            storage_service,
        }
    }
}

impl AuthClient {
    pub async fn sign_in(&self, email: &str, password: &str) -> Result<User> {
        let session = Uuid::new_v4();
        let keypair = keys::generate_keypair();

        let payload = SignInPayload {
            session,
            email: email.to_string(),
            password: password.to_string(),
            public_key: keypair.public_key.clone(),
        };

        let response = self
            .http_client
            .post(&format!("{}/password/sign_in", self.base_url))
            .json(&payload)
            .send()
            .await?;

        if response.status().as_u16() >= 400 {
            let msg = response.json::<Message>().await?;
            return Err(VulpoError::from(msg.code));
        }

        let session = response.json::<SessionResponse>().await?;

        let token = format!("Bearer {}", session.access_token);
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            "Authorization",
            reqwest::header::HeaderValue::from_str(&token).unwrap(),
        );

        let user = self
            .http_client
            .get(&format!("{}/user/get", self.base_url))
            .headers(headers)
            .send()
            .await?
            .json::<User>()
            .await?;

        self.storage_service.set_user(&user)?;
        self.storage_service.set_session(&user.id, &session)?;
        self.storage_service.set_private_key(&user.id, &keypair)?;
        self.storage_service.set_active(&user.id)?;

        Ok(user)
    }

    pub async fn get_token(&self) -> Result<String> {
        let session = self
            .storage_service
            .get_active()?
            .map(|users| users.active)
            .and_then(|active| self.storage_service.get_session(&active).ok())
            .flatten();

        let session = match session {
            Some(session) => session,
            None => return Err(VulpoError::GetAccessToken),
        };

        if Utc::now() > session.expire_at {
            return self.force_token().await;
        }

        Ok(session.access_token)
    }

    pub async fn force_token(&self) -> Result<String> {
        let users = match self.storage_service.get_active()? {
            None => return Err(VulpoError::SessionNotFound),
            Some(session) => session,
        };

        let key = self.storage_service.get_private_key(&users.active)?;
        let token = match RefreshAccessToken::new(key.as_bytes()) {
            None => return Err(VulpoError::RefreshAccessToken),
            Some(token) => token,
        };

        let current = match self.storage_service.get_session(&users.active)? {
            Some(session) => session,
            None => return Err(VulpoError::SessionNotFound),
        };

        let response = self
            .http_client
            .post(&format!(
                "{}/token/refresh/{}",
                self.base_url, current.session
            ))
            .json(&token)
            .send()
            .await?;

        if response.status().as_u16() >= 400 {
            let msg = response.json::<Message>().await?;
            return Err(VulpoError::from(msg.code));
        }

        let session = response.json::<SessionResponse>().await?;
        self.storage_service.set_session(&users.active, &session)?;

        Ok(session.access_token)
    }

    pub fn get_user(&self) -> Result<Option<User>> {
        self.storage_service.get_user()
    }

    pub fn activate(&self, user_id: &Uuid) -> Result<()> {
        self.storage_service.set_active(&user_id)
    }

    pub fn active(&self) -> Result<Option<Uuid>> {
        let active = self.storage_service.get_active()?.map(|u| u.active);
        Ok(active)
    }

    pub async fn sign_out(&self) -> Result<()> {
        let users = match self.storage_service.get_active()? {
            None => return Ok(()),
            Some(session) => session,
        };

        self.storage_service.remove_user(&users.active)?;

        let session = match self.storage_service.get_session(&users.active)? {
            None => return Ok(()),
            Some(session) => session.session,
        };

        let key = self.storage_service.get_private_key(&users.active)?;
        let token = match RefreshAccessToken::new(key.as_bytes()) {
            None => return Ok(()),
            Some(token) => token,
        };

        self.http_client
            .post(&format!("{}/user/sign_out/{}", self.base_url, session,))
            .json(&token)
            .send()
            .await?;

        Ok(())
    }

    pub async fn sign_out_all(&self) -> Result<()> {
        let users = match self.storage_service.get_active()? {
            None => return Ok(()),
            Some(session) => session,
        };

        self.storage_service.remove_user(&users.active)?;

        let session = match self.storage_service.get_session(&users.active)? {
            None => return Ok(()),
            Some(session) => session.session,
        };

        let key = self.storage_service.get_private_key(&users.active)?;
        let token = match RefreshAccessToken::new(key.as_bytes()) {
            None => return Ok(()),
            Some(token) => token,
        };

        self.http_client
            .post(&format!("{}/user/sign_out_all/{}", self.base_url, session,))
            .json(&token)
            .send()
            .await?;

        Ok(())
    }

    pub async fn generate_api_key(
        &self,
        payload: Option<GenerateApiKey>,
    ) -> Result<ApiKeyResponse> {
        let headers = self.get_auth_headers().await?;

        let payload = payload.unwrap_or_else(|| GenerateApiKey {
            name: None,
            expire_at: None,
        });

        let response = self
            .http_client
            .post(&format!("{}/api_key/generate", self.base_url))
            .headers(headers)
            .json(&payload)
            .send()
            .await?;

        if response.status().as_u16() >= 400 {
            let msg = response.json::<Message>().await?;
            return Err(VulpoError::from(msg.code));
        }

        let api_key = response.json::<ApiKeyResponse>().await?;

        Ok(api_key)
    }

    async fn get_auth_headers(&self) -> Result<reqwest::header::HeaderMap> {
        let access_token = self.get_token().await?;
        let token = format!("Bearer {}", access_token);
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            "Authorization",
            reqwest::header::HeaderValue::from_str(&token).unwrap(),
        );

        Ok(headers)
    }
}

#[derive(Debug, Deserialize, Serialize)]
struct Users {
    active: Uuid,
    users: Vec<Uuid>,
}

struct StorageService {
    home_dir: PathBuf,
}

impl StorageService {
    fn new(project_id: &str) -> StorageService {
        let mut home_dir = dirs::home_dir().unwrap_or_else(|| PathBuf::new());
        home_dir.push(".vulpo");
        home_dir.push(&project_id);

        std::fs::create_dir_all(&home_dir).expect("failed to create home directory");

        StorageService { home_dir }
    }

    fn set_active(&self, user_id: &Uuid) -> Result<()> {
        let mut file_path = self.home_dir.clone();
        file_path.push("users");
        file_path.set_extension("json");

        let mut file = File::options()
            .read(true)
            .write(true)
            .create(true)
            .truncate(true)
            .open(file_path)?;

        let mut content = String::new();
        file.read_to_string(&mut content)?;

        let state = match serde_json::from_str::<Users>(&content) {
            Ok(state) => {
                let mut users = state.users.clone();
                users.push(user_id.clone());
                users.dedup();

                Users {
                    active: user_id.clone(),
                    users: users.to_owned(),
                }
            }
            Err(_) => Users {
                active: user_id.clone(),
                users: vec![user_id.clone()],
            },
        };

        let state = serde_json::to_string(&state).unwrap();
        file.write_all(state.as_bytes())?;
        file.flush()?;

        Ok(())
    }

    fn get_active(&self) -> Result<Option<Users>> {
        let mut file_path = self.home_dir.clone();
        file_path.push("users");
        file_path.set_extension("json");

        let mut file = File::options().read(true).open(file_path)?;

        let mut content = String::new();
        file.read_to_string(&mut content)?;

        match serde_json::from_str::<Users>(&content) {
            Ok(users) => Ok(Some(users)),
            Err(_) => Ok(None),
        }
    }

    fn remove_user(&self, user_id: &Uuid) -> Result<()> {
        let mut user_path = self.home_dir.clone();
        user_path.push(&format!("{}", user_id));
        user_path.set_extension("json");

        if user_path.exists() {
            fs::remove_file(user_path)?;
        }

        let users = match self.get_active()? {
            None => return Ok(()),
            Some(users) => users,
        };

        if users.active != *user_id {
            return Ok(());
        }

        let mut users_path = self.home_dir.clone();
        users_path.push("users");
        users_path.set_extension("json");
        if users.users.len() == 1 && users.users.contains(&user_id) && users_path.exists() {
            fs::remove_file(&users_path)?;
        }

        let new_active = users.users.clone().into_iter().find(|id| id != user_id);

        if let Some(id) = new_active {
            let mut file = File::options()
                .write(true)
                .create(true)
                .truncate(true)
                .open(users_path)?;

            let state = Users {
                active: id,
                users: users.users.into_iter().filter(|id| id != user_id).collect(),
            };

            let state = serde_json::to_string(&state).unwrap();
            file.write_all(state.as_bytes())?;
            file.flush()?;
        }

        Ok(())
    }

    fn set_session(&self, user_id: &Uuid, session: &SessionResponse) -> io::Result<()> {
        let mut session_path = self.home_dir.clone();
        session_path.push(&format!("{}", user_id));
        session_path.set_extension("json");

        let session = serde_json::to_string(session).unwrap();

        let mut file = File::create(session_path)?;
        file.write_all(session.as_bytes())?;
        file.flush()?;

        Ok(())
    }

    fn get_session(&self, user_id: &Uuid) -> io::Result<Option<SessionResponse>> {
        let mut file_path = self.home_dir.clone();
        file_path.push(&format!("{}", user_id));
        file_path.set_extension("json");

        let mut file = File::options().read(true).open(file_path)?;

        let mut content = String::new();
        file.read_to_string(&mut content)?;

        match serde_json::from_str::<SessionResponse>(&content) {
            Ok(session) => Ok(Some(session)),
            Err(_) => Ok(None),
        }
    }

    fn set_user(&self, user: &User) -> io::Result<()> {
        let mut file_path = self.home_dir.clone();
        file_path.push(user.id.to_string());
        file_path.set_extension("json");

        let json = serde_json::to_string(user).unwrap();

        let mut file = File::create(file_path)?;
        file.write_all(json.as_bytes())?;
        file.flush()?;

        Ok(())
    }

    fn get_user(&self) -> Result<Option<User>> {
        let users = self.get_active()?;
        let active = match users {
            None => return Ok(None),
            Some(users) => users.active,
        };

        let mut file_path = self.home_dir.clone();
        file_path.push(active.to_string());
        file_path.set_extension("json");

        let mut file = File::options().read(true).open(file_path)?;

        let mut content = String::new();
        file.read_to_string(&mut content)?;

        match serde_json::from_str::<User>(&content) {
            Ok(user) => Ok(Some(user)),
            Err(_) => Ok(None),
        }
    }

    fn set_private_key(&self, user_id: &Uuid, keypair: &KeyPair) -> io::Result<()> {
        let mut private_key = self.home_dir.clone();
        private_key.push(user_id.to_string());
        private_key.set_extension("pem");

        let mut file = File::create(private_key)?;
        file.write_all(&keypair.private_key)?;
        file.flush()?;

        Ok(())
    }

    fn get_private_key(&self, user_id: &Uuid) -> io::Result<String> {
        let mut file_path = self.home_dir.clone();
        file_path.push(user_id.to_string());
        file_path.set_extension("pem");

        let mut file = File::options().read(true).open(file_path)?;

        let mut content = String::new();
        file.read_to_string(&mut content)?;

        Ok(content)
    }
}
