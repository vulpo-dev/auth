use crate::data::keys::ProjectKeys;
use crate::data::token::{AccessToken, RefreshToken};
use crate::data::user::User;
use crate::data::AuthDb;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::response::token::Token;
use chrono::{Duration, Utc};
use rocket::http::CookieJar;
use rocket::Route;
use uuid::Uuid;

#[post("/refresh")]
pub async fn refresh(
    conn: AuthDb,
    project: Project,
    cookies: &CookieJar<'_>,
) -> Result<Token, ApiError> {
    let cookie = match cookies.get("refresh_token") {
        Some(token) => token,
        None => return Err(ApiError::AuthRefreshTokenMissing),
    };

    let id = match Uuid::parse_str(cookie.value()) {
        Err(_) => return Err(ApiError::AuthRefreshTokenInvalidFormat),
        Ok(id) => id,
    };

    let refresh_token = conn
        .run(move |client| RefreshToken::get(client, id))
        .await?;

    if refresh_token.expire - Utc::now() <= Duration::zero() {
        return Err(ApiError::AuthRefreshTokenMissing);
    }

    let current_token = refresh_token.clone();
    let new_refresh_token = conn
        .run(move |client| {
            let mut trx = match client.transaction() {
                Ok(client) => client,
                Err(_) => return Err(ApiError::InternalServerError),
            };
            RefreshToken::set_expire(&mut trx, current_token.id)?;
            let expire = RefreshToken::expire();
            let token =
                RefreshToken::create(&mut trx, current_token.users, expire, current_token.project)?;

            if let Err(_) = trx.commit() {
                return Err(ApiError::InternalServerError);
            }

            Ok(token)
        })
        .await?;

    let users = conn
        .run(move |client| User::get_ids(client, refresh_token.users, &refresh_token.project))
        .await?;

    let ids = users.iter().map(|u| u.id).collect::<Vec<Uuid>>();

    let private_key = conn
        .run(move |client| ProjectKeys::get_private_key(client, &project.id))
        .await?;

    let tokens = users
        .iter()
        .map(|user| AccessToken::new(&user))
        .flat_map(|token| token.to_jwt_rsa(&private_key))
        .collect::<Vec<String>>();

    Ok(Token {
        access_tokens: tokens,
        refresh_token: new_refresh_token.to_string(),
        created: false,
        users: ids,
    })
}

pub fn routes() -> Vec<Route> {
    routes![refresh]
}
