use crate::config::Secrets;
use crate::db::Db;
use crate::keys::data::ProjectKeys;
use crate::project::data::Flags;
use crate::project::data::Project as ProjectData;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::response::SessionResponse;
use crate::session::data::{AccessToken, Session};
use crate::user::data::User;
use crate::user::data::UserState;

use chrono::{Duration, Utc};
use rocket::serde::json::Json;
use rocket::State;
use serde::Deserialize;
use uuid::Uuid;

use super::data::Password;

#[derive(Deserialize)]
pub struct SignIn {
    pub email: String,
    pub password: String,
    pub session: Uuid,
    pub public_key: Vec<u8>,
}

#[post("/sign_in", format = "json", data = "<body>")]
pub async fn sign_in(
    pool: Db,
    body: Json<SignIn>,
    project: Project,
    secrets: &State<Secrets>,
) -> Result<SessionResponse, ApiError> {
    Flags::has_flags(
        &pool,
        &project.id,
        &[Flags::SignIn, Flags::EmailAndPassword],
    )
    .await?;

    let email = body.email.trim().to_lowercase();

    let user = User::get_by_email(&pool, &email, &project.id)
        .await?
        .ok_or_else(|| ApiError::UserNotFound)?;

    let password = Password::get_by_email(&pool, &email, &project.id).await?;

    if !password.verify(&body.password) {
        return Err(ApiError::UserInvalidPassword);
    };

    let current_alg = ProjectData::password_alg(&pool, &project.id).await?;

    if current_alg != password.alg {
        Password::create_password(&pool, &user.id, &body.password, &current_alg, &project.id)
            .await?;
    }

    if user.state == UserState::Disabled {
        return Err(ApiError::UserDisabled);
    }

    let session = Session {
        id: body.session,
        public_key: body.public_key.to_owned(),
        user_id: Some(user.id),
        expire_at: Utc::now() + Duration::days(30),
        project_id: project.id,
    };

    let session = Session::create(&pool, session).await?;

    let private_key = ProjectKeys::get_private_key(&pool, &project.id, &secrets.passphrase).await?;

    let exp = Utc::now() + Duration::minutes(15);
    let access_token = AccessToken::new(&user.id, &user.traits, exp)
        .to_jwt_rsa(&project.id, &private_key)
        .map_err(|_| ApiError::InternalServerError)?;

    Ok(SessionResponse {
        access_token,
        created: false,
        user_id: session.user_id.unwrap(),
        session: session.id,
        expire_at: session.expire_at,
    })
}
