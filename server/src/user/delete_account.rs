use crate::admin::data::Admin;
use crate::db::AuthDb;
use crate::response::error::ApiError;
use crate::user::data::User;

use rocket;
use rocket::http::CookieJar;
use rocket_contrib::uuid::Uuid;
use uuid;

#[post("/delete_account/<user_id>")]
pub async fn admin_delete_account(
    conn: AuthDb,
    user_id: Uuid,
    _admin: Admin,
) -> Result<(), ApiError> {
    let user_id = user_id.into_inner();
    conn.run(move |client| User::remove(client, &user_id))
        .await?;

    Ok(())
}

#[post("/delete_account")]
pub async fn delete_account(conn: AuthDb, cookies: &CookieJar<'_>) -> Result<(), ApiError> {
    let cookie = match cookies.get("refresh_token") {
        Some(token) => token,
        None => return Err(ApiError::AuthRefreshTokenMissing),
    };

    let id = match uuid::Uuid::parse_str(cookie.value()) {
        Err(_) => return Err(ApiError::AuthRefreshTokenInvalidFormat),
        Ok(id) => id,
    };

    conn.run(move |client| User::remove_by_token(client, &id))
        .await?;

    Ok(())
}
