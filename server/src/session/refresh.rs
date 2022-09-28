use crate::config::Secrets;
use crate::keys::data::ProjectKeys;
use crate::project::Project;
use crate::session::data::{AccessToken, RefreshAccessToken, Session};
use crate::user::data::User;

use chrono::{Duration, Utc};
use rocket::serde::json::Json;
use rocket::serde::uuid::Uuid;
use rocket::State;
use vulpo_auth_types::error::ApiError;
use vulpo_auth_types::session::SessionResponse;
use werkbank::rocket::Db;

pub async fn refresh(
    pool: &Db,
    project_id: Uuid,
    session_id: Uuid,
    rat: RefreshAccessToken,
    passphrase: &str,
) -> Result<SessionResponse, ApiError> {
    let session = Session::get(&pool, &session_id).await?;

    if Utc::now() > session.expire_at {
        return Err(ApiError::SessionExpired);
    }

    let claims = Session::validate_token(&session, &rat)?;
    let is_valid = Session::is_valid(&pool, &claims, &session_id, &project_id).await?;

    if !is_valid {
        return Err(ApiError::Forbidden);
    }

    let expire_at = Utc::now() + Duration::days(30);
    Session::extend(&pool, &session.id, &expire_at).await?;

    let private_key = ProjectKeys::get_private_key(&pool, &project_id, &passphrase).await?;

    let user_id = match session.user_id {
        None => return Err(ApiError::Forbidden),
        Some(id) => id,
    };

    let user = User::get_by_id(&pool, &user_id, &project_id)
        .await?
        .ok_or_else(|| ApiError::NotFound)?;

    let exp = Utc::now() + Duration::minutes(15);
    let access_token = AccessToken::new(&user.id, &user.traits, exp)
        .to_jwt_rsa(&project_id, &private_key)
        .map_err(|_| ApiError::InternalServerError)?;

    Ok(SessionResponse {
        access_token,
        user_id,
        created: false,
        session: session.id,
        expire_at: session.expire_at,
    })
}

#[post("/refresh/<session_id>", format = "json", data = "<rat>")]
pub async fn handler(
    pool: Db,
    project: Project,
    session_id: Uuid,
    rat: Json<RefreshAccessToken>,
    secrets: &State<Secrets>,
) -> Result<SessionResponse, ApiError> {
    let session = refresh(
        &pool,
        project.id,
        session_id,
        rat.into_inner(),
        &secrets.passphrase,
    )
    .await?;
    Ok(session)
}
