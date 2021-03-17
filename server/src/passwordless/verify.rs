use crate::config::Secrets;
use crate::db::{AuthDb, Db};
use crate::passwordless::data::Passwordless;
use crate::response::error::ApiError;
use crate::response::SessionResponse;
use crate::session::data::ProjectKeys;
use crate::session::data::{AccessToken, RefreshAccessToken, Session, Token};
use crate::user::data::User;

use chrono::{Duration, Utc};
use rocket::State;
use rocket_contrib::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct Veriy {
    pub token: String,
    pub session: Uuid,
    pub id: Uuid,
}

#[post("/verify", data = "<body>")]
pub async fn handler(
    conn: AuthDb,
    pool: Db<'_>,
    body: Json<Veriy>,
    secrets: State<'_, Secrets>,
) -> Result<SessionResponse, ApiError> {
    let token = Passwordless::get(pool.inner(), &body.id).await?;

    if token.confirmed == false {
        return Err(ApiError::PasswordlessAwaitConfirm);
    }

    if token.is_valid == false {
        return Err(ApiError::PasswordlessInvalidToken);
    }

    let expires_at = token.created_at - Duration::minutes(30);
    if expires_at > Utc::now() {
        return Err(ApiError::PasswordlessTokenExpire);
    }

    Passwordless::remove_all(pool.inner(), &token.email, &token.project_id).await?;

    let session_id = body.session.clone();
    let current_session = conn
        .run(move |client| Session::get(client, &session_id))
        .await?;

    let rat = RefreshAccessToken {
        value: body.into_inner().token,
    };

    let claims = Session::validate_token(&current_session, &rat)?;

    let session_id = current_session.id.clone();
    let is_valid = conn
        .run(move |client| Token::is_valid(client, &claims, &session_id))
        .await?;

    if !is_valid {
        return Err(ApiError::Forbidden);
    }

    let project_id = token.project_id.clone();
    let user = if let Some(user_id) = token.user_id {
        conn.run(move |client| User::get_by_id(client, user_id, project_id))
            .await?
    } else {
        let user_email = token.email.clone();
        conn.run(move |client| User::create_passwordless(client, &user_email, &project_id))
            .await?
    };

    let user_id = user.id;
    let session = conn
        .run(move |client| {
            let expire_at = Utc::now() + Duration::days(30);
            Session::confirm(client, &current_session.id, &user_id, &expire_at)
        })
        .await?;

    let phassphrase = secrets.secrets_passphrase.clone();
    let project_id = token.project_id.clone();
    let private_key = conn
        .run(move |client| ProjectKeys::get_private_key(client, &project_id, &phassphrase))
        .await?;

    let exp = Utc::now() + Duration::minutes(15);
    let access_token = AccessToken::new(&user, exp);
    let access_token = match access_token.to_jwt_rsa(&private_key) {
        Ok(at) => at,
        Err(_) => return Err(ApiError::InternalServerError),
    };

    Ok(SessionResponse {
        access_token,
        created: token.user_id.is_none(),
        user_id: session.user_id.unwrap(),
        session: session.id,
        expire_at: session.expire_at,
    })
}
