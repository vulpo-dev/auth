use crate::cache::Cache;
use crate::config::Secrets;
use crate::keys::data::ProjectKeys;
use crate::password::data::Password;
use crate::project::data::Flags;
use crate::project::data::Project as ProjectData;
use crate::project::Project;
use crate::session::data::{AccessToken, Session};
use crate::user::data::User;
use crate::user::data::UserState;

use chrono::{Duration, Utc};
use rocket::serde::json::Json;
use rocket::State;
use uuid::Uuid;
use vulpo_auth_types::{error::ApiError, session::SessionResponse, SignInPayload};
use werkbank::rocket::Db;

pub async fn sign_in(
    cache: &Cache,
    pool: &Db,
    payload: SignInPayload,
    project_id: Uuid,
    passphrase: &str,
) -> Result<SessionResponse, ApiError> {
    let email = payload.email.trim().to_lowercase();

    let user = User::get_by_email(&pool, &email, &project_id)
        .await?
        .ok_or_else(|| ApiError::UserNotFound)?;

    let password = Password::get_by_email(&pool, &email, &project_id).await?;

    if !password.verify(&payload.password) {
        return Err(ApiError::UserInvalidPassword);
    };

    let current_alg = ProjectData::password_alg(&pool, &project_id).await?;

    if current_alg != password.alg {
        Password::create_password(
            &pool,
            &user.id,
            &payload.password,
            &current_alg,
            &project_id,
        )
        .await?;
    }

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

    let session = Session::create(&pool, session).await?;

    let private_key = ProjectKeys::get_private_key(&cache, &pool, &project_id, passphrase).await?;
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

#[post("/sign_in", format = "json", data = "<body>")]
pub async fn sign_in_handler(
    pool: Db,
    body: Json<SignInPayload>,
    project: Project,
    secrets: &State<Secrets>,
    cache: Cache,
) -> Result<SessionResponse, ApiError> {
    Flags::has_flags(
        &pool,
        &project.id,
        &[Flags::SignIn, Flags::EmailAndPassword],
    )
    .await?;

    let session = sign_in(
        &cache,
        &pool,
        body.into_inner(),
        project.id,
        &secrets.passphrase,
    )
    .await?;
    Ok(session)
}
