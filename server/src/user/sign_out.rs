use crate::admin::data::Admin;
use crate::db::Db;
use crate::response::error::ApiError;
use crate::session::data::Token;
use crate::session::data::{RefreshAccessToken, Session};

use rocket;
use rocket::serde::json::Json;
use rocket::serde::uuid::Uuid;

#[post("/sign_out/<session_id>", format = "json", data = "<rat>")]
pub async fn sign_out(
    pool: Db<'_>,
    session_id: Uuid,
    rat: Json<RefreshAccessToken>,
) -> Result<(), ApiError> {
    let session = Session::get(pool.inner(), &session_id).await?;
    let claims = Session::validate_token(&session, &rat)?;

    let is_valid = Token::is_valid(pool.inner(), &claims, &session_id).await?;

    if !is_valid {
        return Err(ApiError::Forbidden);
    }

    Session::delete(pool.inner(), &session.id).await?;

    Ok(())
}

#[post("/admin/sign_out/<user_id>")]
pub async fn admin_sign_out(pool: Db<'_>, user_id: Uuid, _admin: Admin) -> Result<(), ApiError> {
    Session::delete_by_user(pool.inner(), &user_id).await?;
    Ok(())
}

#[post("/sign_out_all/<session_id>", format = "json", data = "<rat>")]
pub async fn sign_out_all(
    pool: Db<'_>,
    session_id: Uuid,
    rat: Json<RefreshAccessToken>,
) -> Result<(), ApiError> {
    let session = Session::get(pool.inner(), &session_id).await?;
    let claims = Session::validate_token(&session, &rat)?;

    let is_valid = Token::is_valid(pool.inner(), &claims, &session_id).await?;

    if !is_valid {
        return Err(ApiError::Forbidden);
    }

    Session::delete_all(pool.inner(), &session.id).await?;

    Ok(())
}
