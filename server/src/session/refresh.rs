use crate::config::Secrets;
use crate::db::Db;
use crate::keys::data::ProjectKeys;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::response::SessionResponse;
use crate::session::data::{AccessToken, RefreshAccessToken, Session};
use crate::user::data::User;

use chrono::{Duration, Utc};
use rocket::serde::json::Json;
use rocket::serde::uuid::Uuid;
use rocket::State;

#[post("/refresh/<session_id>", format = "json", data = "<rat>")]
pub async fn handler(
    pool: Db,
    project: Project,
    session_id: Uuid,
    rat: Json<RefreshAccessToken>,
    secrets: &State<Secrets>,
) -> Result<SessionResponse, ApiError> {
    let session = Session::get(&pool, &session_id).await?;

    if Utc::now() > session.expire_at {
        return Err(ApiError::SessionExpired);
    }

    let claims = Session::validate_token(&session, &rat)?;
    let is_valid = Session::is_valid(&pool, &claims, &session_id, &project.id).await?;

    if !is_valid {
        return Err(ApiError::Forbidden);
    }

    let expire_at = Utc::now() + Duration::days(30);
    Session::extend(&pool, &session.id, &expire_at).await?;

    let private_key = ProjectKeys::get_private_key(&pool, &project.id, &secrets.passphrase).await?;

    let user_id = match session.user_id {
        None => return Err(ApiError::Forbidden),
        Some(id) => id,
    };

    let user = User::get_by_id(&pool, &user_id, &project.id).await?;

    let exp = Utc::now() + Duration::minutes(15);
    let access_token = AccessToken::new(&user.id, &user.traits, exp)
        .to_jwt_rsa(&project.id, &private_key)
        .map_err(|_| ApiError::InternalServerError)?;

    Ok(SessionResponse {
        access_token,
        user_id,
        created: false,
        session: session.id,
        expire_at: session.expire_at,
    })
}
