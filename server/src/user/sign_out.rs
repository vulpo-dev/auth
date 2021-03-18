use crate::admin::data::Admin;
use crate::db::Db;
use crate::response::error::ApiError;
use crate::session::data::Token;
use crate::session::data::{RefreshAccessToken, Session};

use rocket;
use rocket_contrib::json::Json;
use rocket_contrib::uuid::Uuid;

#[post("/sign_out/<session_id>", data = "<rat>")]
pub async fn sign_out(
    pool: Db<'_>,
    session_id: Uuid,
    rat: Json<RefreshAccessToken>,
) -> Result<(), ApiError> {
    let session = Session::get(pool.inner(), &session_id).await?;
    let claims = Session::validate_token(&session, &rat)?;

    let is_valid = Token::is_valid(pool.inner(), &claims, &session_id.into_inner()).await?;

    if !is_valid {
        return Err(ApiError::Forbidden);
    }

    Session::delete(pool.inner(), &session.id).await?;

    Ok(())
}

#[post("/sign_out/<user_id>", rank = 2)]
pub async fn admin_sign_out(pool: Db<'_>, user_id: Uuid, _admin: Admin) -> Result<(), ApiError> {
    let user_id = user_id.into_inner();
    Session::delete_by_user(pool.inner(), &user_id).await?;

    Ok(())
}

#[post("/sign_out_all/<session_id>", data = "<rat>")]
pub async fn sign_out_all(
    pool: Db<'_>,
    session_id: Uuid,
    rat: Json<RefreshAccessToken>,
) -> Result<(), ApiError> {
    let session = Session::get(pool.inner(), &session_id).await?;
    let claims = Session::validate_token(&session, &rat)?;

    let is_valid = Token::is_valid(pool.inner(), &claims, &session_id.into_inner()).await?;

    if !is_valid {
        return Err(ApiError::Forbidden);
    }

    Session::delete_all(pool.inner(), &session.id).await?;

    Ok(())
}
