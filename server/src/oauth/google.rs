use crate::admin::data::Admin;
use crate::cache::Cache;
use crate::config::Secrets;
use crate::keys::data::ProjectKeys;
use crate::oauth::data::google::GoogleMeResponse;
use crate::oauth::data::OAuthData;
use crate::oauth::data::{google::GoogleConfig, OAuthRequestState};
use crate::project::data::Flags;
use crate::project::Project;
use crate::session::data::{AccessToken, Session};
use crate::user::data::{User, UserProvider, UserState};

use chrono::{Duration, Utc};
use oauth2::reqwest::async_http_client;
use oauth2::{basic::BasicClient, TokenResponse};
use oauth2::{
    AuthUrl, AuthorizationCode, ClientId, ClientSecret, CsrfToken, PkceCodeChallenge,
    PkceCodeVerifier, RedirectUrl, Scope, TokenUrl,
};
use reqwest;
use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;
use vulpo_auth_types::error::ApiError;
use vulpo_auth_types::session::SessionResponse;
use werkbank::rocket::Db;

const GOOGLE_ME_ENDPOINT: &'static str =
    "https://people.googleapis.com/v1/people/me?personFields=emailAddresses,metadata,names,photos";

const GOOGLE: &'static str = "google";

#[derive(Deserialize)]
pub struct GetAuthUrlPayload {
    pub request_id: Uuid,
}

#[derive(Serialize)]
pub struct GetAuthUrlResponse {
    pub url: String,
}

pub async fn get_authorize_url(
    pool: &Db,
    request_id: Uuid,
    project_id: &Uuid,
) -> Result<String, ApiError> {
    let client = get_client(&pool, &project_id).await?;

    let (pkce_code_challenge, pkce_code_verifier) = PkceCodeChallenge::new_random_sha256();
    let (authorize_url, csrf_state) = client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("profile".to_string()))
        .add_scope(Scope::new("email".to_string()))
        .add_scope(Scope::new("openid".to_string()))
        .set_pkce_challenge(pkce_code_challenge)
        .url();

    OAuthRequestState::insert(
        &pool,
        request_id,
        Some(csrf_state.secret()),
        Some(pkce_code_verifier.secret()),
        &project_id,
    )
    .await?;

    Ok(authorize_url.to_string())
}

#[post("/google/authorize_url", format = "json", data = "<body>")]
pub async fn get_auth_url(
    db: Db,
    body: Json<GetAuthUrlPayload>,
    project: Project,
) -> Result<Json<GetAuthUrlResponse>, ApiError> {
    Flags::has_flags(&db, &project.id, &[Flags::OAuthGoogle]).await?;
    let url = get_authorize_url(&db, body.request_id, &project.id).await?;
    let response = Json(GetAuthUrlResponse { url });
    Ok(response)
}

#[derive(Deserialize)]
pub struct GoogleConfirmPayload {
    pub request_id: Uuid,
    pub csrf_token: String,
    pub code: String,

    pub session: Uuid,
    pub public_key: Vec<u8>,
    pub device_languages: Vec<String>,
}

pub async fn google_confirm(
    cache: &Cache,
    db: &Db,
    payload: GoogleConfirmPayload,
    project_id: Uuid,
    passphrase: &str,
) -> Result<SessionResponse, ApiError> {
    let request_state = OAuthRequestState::get(&db, &payload.request_id).await?;

    let csrf_token = CsrfToken::new(payload.csrf_token.clone());
    if csrf_token.secret() != &request_state.csrf_token {
        return Err(ApiError::BadRequest);
    }

    let client = get_client(&db, &project_id).await?;

    let code = AuthorizationCode::new(payload.code.clone());

    let pkce_code_verifier = request_state
        .pkce_code_verifier
        .map(PkceCodeVerifier::new)
        .ok_or(ApiError::BadRequest)?;

    let token_response = client
        .exchange_code(code)
        .set_pkce_verifier(pkce_code_verifier)
        .request_async(async_http_client)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

    let mut headers = reqwest::header::HeaderMap::new();
    let bearer = format!("Bearer {}", token_response.access_token().secret());
    let auth_value = reqwest::header::HeaderValue::from_str(bearer.as_str()).unwrap();
    headers.insert(reqwest::header::AUTHORIZATION, auth_value);

    let google_client = reqwest::Client::builder()
        .default_headers(headers)
        .build()
        .map_err(|_| ApiError::InternalServerError)?;

    let res = google_client
        .get(GOOGLE_ME_ENDPOINT)
        .send()
        .await
        .map_err(|_| ApiError::InternalServerError)?
        .json::<GoogleMeResponse>()
        .await
        .map_err(|_| ApiError::InternalServerError)?;

    let google_id = get_google_id(&res)?;
    let user_id = OAuthData::get_user_id(&db, &google_id, GOOGLE, &project_id).await?;

    let user = match user_id {
        Some(uid) => User::get_by_id(&db, &uid, &project_id)
            .await?
            .ok_or(ApiError::InternalServerError)?,
        None => {
            Flags::has_flags(&db, &project_id, &[Flags::SignUp]).await?;

            let provider_user = get_user(res, payload.device_languages.clone())?;
            let user = User::create_provider(&db, &provider_user, &project_id).await?;

            OAuthData::upsert(
                &db,
                &google_id,
                GOOGLE,
                &provider_user.email,
                &user.id,
                &project_id,
            )
            .await?;

            user
        }
    };

    if user.state == UserState::Disabled {
        return Err(ApiError::UserDisabled);
    }

    let session = Session {
        id: payload.session,
        public_key: payload.public_key.to_owned(),
        user_id: Some(user.id),
        expire_at: Utc::now() + Duration::days(30),
        project_id,
    };

    let session = Session::create(&db, session).await?;

    let private_key = ProjectKeys::get_private_key(&cache, &db, &project_id, passphrase).await?;

    let exp = Utc::now() + Duration::minutes(15);
    let access_token = AccessToken::new(&user.id, &user.traits, exp)
        .to_jwt(&project_id, &private_key)
        .map_err(|_| ApiError::InternalServerError)?;

    Ok(SessionResponse {
        access_token,
        created: false,
        user_id: session.user_id.unwrap(),
        session: session.id,
        expire_at: session.expire_at,
    })
}

#[post("/google/confirm", format = "json", data = "<body>")]
pub async fn exchange_code(
    db: Db,
    body: Json<GoogleConfirmPayload>,
    project: Project,
    secrets: &State<Secrets>,
    cache: Cache,
) -> Result<SessionResponse, ApiError> {
    let session = google_confirm(
        &cache,
        &db,
        body.into_inner(),
        project.id,
        &secrets.passphrase,
    )
    .await?;
    Ok(session)
}

pub async fn upsert_config(
    pool: &Db,
    config: GoogleConfig,
    project_id: &Uuid,
) -> Result<(), ApiError> {
    if RedirectUrl::new(config.redirect_uri.clone()).is_err() {
        return Err(ApiError::BadRequest);
    }

    GoogleConfig::upsert(&pool, &project_id, &config).await?;

    Ok(())
}

#[post("/google/set_config?<project>", format = "json", data = "<config>")]
pub async fn set_config(
    _admin: Admin,
    db: Db,
    config: Json<GoogleConfig>,
    project: Uuid,
) -> Result<Status, ApiError> {
    upsert_config(&db, config.into_inner(), &project).await?;
    Ok(Status::Ok)
}

pub async fn get_client_config(
    db: &Db,
    project_id: &Uuid,
) -> Result<Option<GoogleConfig>, ApiError> {
    let config = GoogleConfig::get(&db, &project_id).await?;
    Ok(config)
}

#[get("/google/get_config?<project>")]
pub async fn get_config(
    _admin: Admin,
    db: Db,
    project: Uuid,
) -> Result<Json<Option<GoogleConfig>>, ApiError> {
    let config = get_client_config(&db, &project).await?;
    Ok(Json(config))
}

async fn get_client(pool: &PgPool, project_id: &Uuid) -> Result<BasicClient, ApiError> {
    let config = GoogleConfig::get(&pool, &project_id)
        .await?
        .ok_or(ApiError::BadRequest)?;

    let google_client_id = ClientId::new(config.client_id);
    let google_client_secret = ClientSecret::new(config.client_secret);

    let auth_url =
        AuthUrl::new("https://accounts.google.com/o/oauth2/v2/auth".to_string()).unwrap();
    let token_url =
        TokenUrl::new("https://www.googleapis.com/oauth2/v3/token".to_string()).unwrap();
    let redirect_utl =
        RedirectUrl::new(config.redirect_uri).map_err(|_| ApiError::InternalServerError)?;

    let client = BasicClient::new(
        google_client_id,
        Some(google_client_secret),
        auth_url,
        Some(token_url),
    )
    .set_redirect_uri(redirect_utl);

    Ok(client)
}

fn get_google_id(data: &GoogleMeResponse) -> Result<String, ApiError> {
    data.metadata
        .sources
        .get(0)
        .ok_or(ApiError::BadRequest)
        .map(|source| source.id.clone())
}

fn get_user(
    data: GoogleMeResponse,
    device_languages: Vec<String>,
) -> Result<UserProvider, ApiError> {
    let email = data.email_addresses.get(0).ok_or(ApiError::BadRequest)?;
    let display_name = data.names.get(0).map(|name| name.display_name.to_owned());
    let photo_url = data.photos.get(0).map(|photo| photo.url.to_owned());

    let user = UserProvider {
        email: email.value.to_owned(),
        display_name,
        photo_url,
        provider_id: String::from(GOOGLE),
        device_languages,
    };

    Ok(user)
}
