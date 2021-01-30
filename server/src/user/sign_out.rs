use crate::data::admin::Admin;
use crate::data::token::RefreshToken;
use crate::data::AuthDb;
use crate::response::error::ApiError;

use rocket;
use rocket::http::CookieJar;
use rocket_contrib::uuid::Uuid;
use uuid;

#[post("/sign_out/<user_id>")]
pub async fn sign_out(
    conn: AuthDb,
    user_id: Uuid,
    cookies: &CookieJar<'_>,
) -> Result<(), ApiError> {
    let cookie = match cookies.get("refresh_token") {
        Some(token) => token,
        None => return Err(ApiError::AuthRefreshTokenMissing),
    };

    let id = match uuid::Uuid::parse_str(cookie.value()) {
        Err(_) => return Err(ApiError::AuthRefreshTokenInvalidFormat),
        Ok(id) => id,
    };

    conn.run(move |client| RefreshToken::remove(client, &id, &user_id.into_inner()))
        .await?;

    Ok(())
}

#[post("/sign_out/<user_id>", rank = 2)]
pub async fn admin_sign_out(conn: AuthDb, user_id: Uuid, _admin: Admin) -> Result<(), ApiError> {
    let user_id = user_id.into_inner();

    conn.run(move |client| RefreshToken::remove_by_user(client, &user_id))
        .await?;

    Ok(())
}

#[post("/sign_out_all/<user_id>")]
pub async fn sign_out_all(
    conn: AuthDb,
    user_id: Uuid,
    cookies: &CookieJar<'_>,
) -> Result<(), ApiError> {
    let cookie = match cookies.get("refresh_token") {
        Some(token) => token,
        None => return Err(ApiError::AuthRefreshTokenMissing),
    };

    let id = match uuid::Uuid::parse_str(cookie.value()) {
        Err(_) => return Err(ApiError::AuthRefreshTokenInvalidFormat),
        Ok(id) => id,
    };

    conn.run(move |client| RefreshToken::remove_all(client, &id, &user_id.into_inner()))
        .await?;

    Ok(())
}
