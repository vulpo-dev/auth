use chrono::{DateTime, Utc};
use jsonwebtoken as jwt;
use jsonwebtoken::{Algorithm, DecodingKey, Validation};
use reqwest;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;
use std::mem;
use std::sync::Mutex;
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize)]
pub struct Claims {
    pub sub: Uuid,
    pub exp: i64,
    pub iss: Uuid,
    pub traits: Vec<String>,
}

type Key = Vec<u8>;

#[derive(Debug)]
pub enum Error {
    KeyMissing,
    InvalidKey,
    InvalidClaims,
    InvalidPayload,
    GetKeysRequest,
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[derive(Debug)]
pub struct AuthKeys {
    pub keys: Mutex<HashMap<Uuid, Key>>,
    pub expire_at: Mutex<DateTime<Utc>>,
    pub url: String,
}

impl AuthKeys {
    pub async fn get_keys(url: &str) -> Result<AuthKeys, Error> {
        let res = match reqwest::get(url).await {
            Err(_) => return Err(Error::GetKeysRequest),
            Ok(res) => res,
        };

        let res = match res.json::<PublicKeys>().await {
            Err(_) => return Err(Error::InvalidPayload),
            Ok(json) => json,
        };

        let mut keys = HashMap::new();
        res.keys.iter().for_each(|key| {
            keys.insert(key.id, key.key.to_owned());
        });

        let expire_at = Mutex::new(res.expire_at);
        let keys = Mutex::new(keys);

        Ok(AuthKeys {
            expire_at,
            keys,
            url: String::from(url),
        })
    }

    pub async fn key(&self, id: &Uuid) -> Option<Key> {
        let expired = match self.expire_at.lock() {
            Err(_) => return None,
            Ok(exp) => *exp >= Utc::now(),
        };

        if expired {
            let new_keys = AuthKeys::get_keys(&self.url).await.unwrap();

            let mut exp = self.expire_at.lock().unwrap();
            let _ = mem::replace(&mut exp, new_keys.expire_at.lock().unwrap());

            let mut keys = self.keys.lock().unwrap();
            keys.clear();
            new_keys
                .keys
                .lock()
                .unwrap()
                .iter()
                .for_each(|(id, entry)| {
                    keys.insert(*id, entry.to_vec());
                });
        }

        let keys = match self.keys.lock() {
            Err(_) => return None,
            Ok(keys) => keys,
        };

        match keys.get(&id) {
            None => None,
            Some(key) => Some(key.to_vec()),
        }
    }

    pub fn bearer_token(value: &str) -> String {
        let end = value.len();
        let start = "Bearer ".len();
        value[start..end].to_string()
    }

    pub fn dangerous_claims(token: &String) -> Result<Claims, Error> {
        match jwt::dangerous_insecure_decode::<Claims>(&token) {
            Err(_) => Err(Error::InvalidClaims),
            Ok(token_data) => Ok(token_data.claims),
        }
    }

    pub async fn verify_token(&self, token: &String) -> Result<Claims, Error> {
        let claims = AuthKeys::dangerous_claims(&token)?;

        let key = match self.key(&claims.iss).await {
            None => return Err(Error::KeyMissing),
            Some(key) => key,
        };

        let decoding_key = match DecodingKey::from_rsa_pem(&key) {
            Err(_) => return Err(Error::InvalidKey),
            Ok(dk) => dk,
        };

        match jwt::decode::<Claims>(&token, &decoding_key, &Validation::new(Algorithm::RS256)) {
            Err(_) => return Err(Error::InvalidClaims),
            Ok(td) => Ok(td.claims),
        }
    }
}

#[derive(Deserialize)]
pub struct PublicKeys {
    pub expire_at: DateTime<Utc>,
    pub keys: Vec<PublicKey>,
}

#[derive(Deserialize)]
pub struct PublicKey {
    pub id: Uuid,
    pub key: Vec<u8>,
}
