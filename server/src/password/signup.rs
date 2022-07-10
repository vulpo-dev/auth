use crate::config::Secrets;
use crate::db::Db;
use crate::keys::data::ProjectKeys;
use crate::password::validate_password_length;
use crate::project::data::Flags;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::response::SessionResponse;
use crate::session::data::{AccessToken, Session};
use crate::user::data::User;
use crate::user::verify_email::send as send_email_verification;

use chrono::{Duration, Utc};
use rocket::serde::json::Json;
use rocket::State;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct SignUp {
    pub email: String,
    pub password: String,
    pub session: Uuid,
    pub public_key: Vec<u8>,
    pub device_languages: Vec<String>,
}

pub async fn sign_up(
    pool: &Db,
    body: SignUp,
    project_id: Uuid,
    passphrase: &str,
) -> Result<SessionResponse, ApiError> {
    validate_password_length(&body.password)?;

    let email = body.email.trim().to_lowercase();
    let user_id = User::create(
        &pool,
        &email,
        &body.password,
        project_id,
        &body.device_languages,
    )
    .await?;

    let private_key = ProjectKeys::get_private_key(&pool, &project_id, &passphrase).await?;

    let exp = Utc::now() + Duration::minutes(15);
    let access_token = AccessToken::new(&user_id, &vec![], exp)
        .to_jwt_rsa(&project_id, &private_key)
        .map_err(|_| ApiError::InternalServerError)?;

    let session = Session {
        id: body.session,
        public_key: body.public_key.to_owned(),
        user_id: Some(user_id),
        expire_at: Utc::now() + Duration::days(30),
        project_id,
    };

    let session = Session::create(&pool, session).await?;

    let verify = Flags::has_flags(&pool, &project_id, &[Flags::VerifyEmail]).await;

    if verify.is_ok() {
        send_email_verification(&pool, &user_id, &project_id, &email).await?;
    }

    Ok(SessionResponse {
        access_token,
        created: true,
        user_id: session.user_id.unwrap(),
        session: session.id,
        expire_at: session.expire_at,
    })
}

#[post("/sign_up", format = "json", data = "<body>")]
pub async fn sign_up_handler(
    pool: Db,
    body: Json<SignUp>,
    project: Project,
    secrets: &State<Secrets>,
) -> Result<SessionResponse, ApiError> {
    Flags::has_flags(
        &pool,
        &project.id,
        &[Flags::SignUp, Flags::EmailAndPassword],
    )
    .await?;

    let session = sign_up(&pool, body.into_inner(), project.id, &secrets.passphrase).await?;
    Ok(session)
}
