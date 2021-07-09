use crate::config::Secrets;
use crate::db::Db;
use crate::keys::data::ProjectKeys;
use crate::project::data::Flags;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::response::SessionResponse;
use crate::session::data::{AccessToken, Session};
use crate::user::data::User;

use bcrypt::verify;

use chrono::{Duration, Utc};
use rocket::serde::json::Json;
use rocket::State;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct SignIn {
    pub email: String,
    pub password: String,
    pub session: Uuid,
    pub public_key: Vec<u8>,
}

#[post("/sign_in", format = "json", data = "<body>")]
pub async fn sign_in(
    pool: Db<'_>,
    body: Json<SignIn>,
    project: Project,
    secrets: &State<Secrets>,
) -> Result<SessionResponse, ApiError> {
    Flags::has_flags(
        pool.inner(),
        &project.id,
        &[Flags::SignIn, Flags::EmailAndPassword],
    )
    .await?;

    let email = body.email.trim().to_lowercase();
    let user = User::password(pool.inner(), email, &project.id).await?;

    if user.disabled {
        return Err(ApiError::UserDisabled);
    }

    let password = match user.password {
        Some(ref password) => password,
        None => return Err(ApiError::UserInvalidPassword),
    };

    let password_valid = match verify(body.password.clone(), &password) {
        Err(_) => false,
        Ok(value) => value,
    };

    if !password_valid {
        return Err(ApiError::UserInvalidPassword);
    };

    let session = Session {
        id: body.session,
        public_key: body.public_key.to_owned(),
        user_id: Some(user.id),
        expire_at: Utc::now() + Duration::days(30),
    };

    let session = Session::create(pool.inner(), session).await?;

    let private_key =
        ProjectKeys::get_private_key(pool.inner(), &project.id, &secrets.secrets_passphrase)
            .await?;

    let exp = Utc::now() + Duration::minutes(15);
    let access_token = AccessToken::new(&user, exp, &project.id)
        .to_jwt_rsa(&private_key)
        .map_err(|_| ApiError::InternalServerError)?;

    Ok(SessionResponse {
        access_token,
        created: false,
        user_id: session.user_id.unwrap(),
        session: session.id,
        expire_at: session.expire_at,
    })
}
