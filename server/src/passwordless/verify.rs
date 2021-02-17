use crate::config::secrets::Secrets;
use crate::data::keys::ProjectKeys;
use crate::data::token::{AccessToken, Passwordless, RefreshToken};
use crate::data::user::User;
use crate::data::AuthDb;
use crate::response::error::ApiError;
use crate::response::token::Token;

use chrono::{Duration, Utc};
use rocket::http::CookieJar;
use rocket::State;
use rocket_contrib::uuid::Uuid as RocketUuid;
use uuid::Uuid;

#[get("/verify?<token>")]
pub async fn handler(
    conn: AuthDb,
    token: RocketUuid,
    cookies: &CookieJar<'_>,
    secrets: State<'_, Secrets>,
) -> Result<Token, ApiError> {
    let token = conn
        .run(move |client| Passwordless::get(client, &token.into_inner()))
        .await?;

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

    let email = token.email.clone();
    let project_id = token.project_id.clone();
    conn.run(move |client| Passwordless::remove_all(client, &email, &project_id))
        .await?;

    let project_id = token.project_id.clone();
    let user = if let Some(user_id) = token.user_id {
        conn.run(move |client| User::get_by_id(client, user_id, project_id))
            .await?
    } else {
        let user_email = token.email.clone();
        conn.run(move |client| User::create_passwordless(client, &user_email, &project_id))
            .await?
    };

    // todo: refactor this as shared module
    let refresh_token_id = cookies
        .get("refresh_token")
        .and_then(|cookie| Uuid::parse_str(cookie.value()).ok());

    let refresh_token = match refresh_token_id {
        None => None,
        Some(id) => conn
            .run(move |client| RefreshToken::get(client, id))
            .await
            .ok(),
    };

    let expire = RefreshToken::expire();
    let users = if let Some(token) = refresh_token {
        token
            .users
            .iter()
            .filter(|id| id != &&user.id)
            .chain(&vec![user.id])
            .map(|&x| x)
            .collect::<Vec<Uuid>>()
    } else {
        vec![user.id]
    };

    let uses_ids = users.clone();
    let project_id = token.project_id.clone();
    let refresh_token = conn
        .run(move |client| RefreshToken::create(client, uses_ids, expire, project_id))
        .await?;

    let phassphrase = secrets.secrets_passphrase.clone();
    let project_id = token.project_id.clone();
    let private_key = conn
        .run(move |client| ProjectKeys::get_private_key(client, &project_id, &phassphrase))
        .await?;

    let access_token = AccessToken::new(&user);
    let access_token = match access_token.to_jwt_rsa(&private_key) {
        Ok(at) => at,
        Err(_) => return Err(ApiError::InternalServerError),
    };

    Ok(Token {
        access_token,
        refresh_token: refresh_token.to_string(),
        created: token.user_id.is_none(),
        user_id: user.id,
    })
}
