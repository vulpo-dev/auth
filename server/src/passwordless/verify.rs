use crate::config::Secrets;
use crate::db::Db;
use crate::keys::data::ProjectKeys;
use crate::passwordless::data::Passwordless;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::response::SessionResponse;
use crate::session::data::{AccessToken, RefreshAccessToken, Session};
use crate::user::data::User;

use chrono::{Duration, Utc};
use rocket::serde::json::Json;
use rocket::State;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct Veriy {
    pub token: String,
    pub session: Uuid,
    pub id: Uuid,
    pub device_languages: Vec<String>,
}

#[post("/verify", format = "json", data = "<body>")]
pub async fn handler(
    pool: Db,
    body: Json<Veriy>,
    secrets: &State<Secrets>,
    project: Project,
) -> Result<SessionResponse, ApiError> {
    let token = Passwordless::get(&pool, &body.id).await?;

    if token.confirmed == false {
        return Err(ApiError::PasswordlessAwaitConfirm);
    }

    if token.is_valid == false {
        return Err(ApiError::PasswordlessInvalidToken);
    }

    let expires_at = token.created_at + Duration::minutes(30);
    if Utc::now() > expires_at {
        return Err(ApiError::PasswordlessTokenExpire);
    }

    Passwordless::remove_all(&pool, &token.email, &token.project_id).await?;

    let current_session = Session::get(&pool, &body.session).await?;

    let device_languages = body.device_languages.clone();
    let rat = RefreshAccessToken {
        value: body.into_inner().token,
    };

    let claims = Session::validate_token(&current_session, &rat)?;
    let is_valid = Session::is_valid(&pool, &claims, &current_session.id).await?;

    if !is_valid {
        return Err(ApiError::Forbidden);
    }

    let user = match token.user_id {
        None => {
            User::create_passwordless(&pool, &token.email, &token.project_id, &device_languages)
                .await?
        }
        Some(user_id) => User::get_by_id(&pool, &user_id, &token.project_id).await?,
    };

    let expire_at = Utc::now() + Duration::days(30);
    let session = Session::confirm(&pool, &current_session.id, &user.id, &expire_at).await?;

    let private_key =
        ProjectKeys::get_private_key(&pool, &token.project_id, &secrets.passphrase).await?;

    let exp = Utc::now() + Duration::minutes(15);
    let access_token = AccessToken::new(&user.id, &user.traits, exp)
        .to_jwt_rsa(&project.id, &private_key)
        .map_err(|_| ApiError::InternalServerError)?;

    Ok(SessionResponse {
        access_token,
        created: token.user_id.is_none(),
        user_id: session.user_id.unwrap(),
        session: session.id,
        expire_at: session.expire_at,
    })
}
