use crate::data::token::{RefreshToken, Token as Jwt};
use crate::data::user::User;
use crate::db::AuthDb;
use crate::response::error::ApiError;
use crate::response::token::Token;
use chrono::{Duration, Utc};
use rocket::http::CookieJar;
use rocket::Route;
use uuid::Uuid;

#[post("/refresh")]
pub async fn refresh(conn: AuthDb, cookies: &CookieJar<'_>) -> Result<Token, ApiError> {
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
                RefreshToken::create(&mut trx, current_token.user, expire, current_token.project)?;

            if let Err(_) = trx.commit() {
                return Err(ApiError::InternalServerError);
            }

            Ok(token)
        })
        .await?;

    let user = User::get_by_id(&conn, refresh_token.user, refresh_token.project).await?;
    let token = Jwt::access_token(&user)?;

    Ok(Token {
        access_token: token,
        refresh_token: new_refresh_token.to_string(),
        created: false,
    })
}

pub fn routes() -> Vec<Route> {
    routes![refresh]
}
