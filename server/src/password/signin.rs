use crate::config::secrets::Secrets;
use crate::data::keys::ProjectKeys;
use crate::data::project::Flags;
use crate::data::session::Session;
use crate::data::user::User;
use crate::data::AuthDb;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::response::SessionResponse;
use crate::token::AccessToken;

use bcrypt::verify;

use chrono::{Duration, Utc};
use rocket::State;
use rocket_contrib::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct SignIn {
    pub email: String,
    pub password: String,
    pub session: Uuid,
    pub public_key: Vec<u8>,
}

#[post("/sign_in", data = "<body>")]
pub async fn sign_in(
    conn: AuthDb,
    body: Json<SignIn>,
    project: Project,
    secrets: State<'_, Secrets>,
) -> Result<SessionResponse, ApiError> {
    conn.run(move |client| {
        Flags::has_flags(
            client,
            &project.id,
            &[Flags::SignIn, Flags::EmailAndPassword],
        )
    })
    .await?;

    let email = body.email.trim().to_lowercase();
    let user = conn
        .run(move |client| User::password(client, email, project.id))
        .await?;

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

    let user_id = user.id;
    let session_id = body.session.clone();
    let public_key = body.public_key.clone();
    let session = conn
        .run(move |client| {
            let session = Session {
                id: session_id,
                public_key,
                user_id: Some(user_id),
                expire_at: Utc::now() + Duration::days(30),
            };

            Session::create(client, session)
        })
        .await?;

    let phassphrase = secrets.secrets_passphrase.clone();
    let private_key = conn
        .run(move |client| ProjectKeys::get_private_key(client, &project.id, &phassphrase))
        .await?;

    let exp = Utc::now() + Duration::minutes(15);
    let access_token = AccessToken::new(&user, exp);
    let access_token = match access_token.to_jwt_rsa(&private_key) {
        Ok(at) => at,
        Err(_) => return Err(ApiError::InternalServerError),
    };

    Ok(SessionResponse {
        access_token,
        created: false,
        user_id: session.user_id.unwrap(),
        session: session.id,
        expire_at: session.expire_at,
    })
}
