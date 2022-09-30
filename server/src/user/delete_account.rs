use crate::admin::data::Admin;
use crate::session::data::{RefreshAccessToken, Session};
use crate::user::data::User;

use rocket;
use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::serde::uuid::Uuid;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

pub async fn delete_account(pool: &Db, user_id: Uuid) -> Result<(), ApiError> {
    User::remove(&pool, &user_id).await?;
    Ok(())
}

#[post("/admin/delete_account/<user_id>")]
pub async fn admin_delete_account_handler(
    pool: Db,
    user_id: Uuid,
    _admin: Admin,
) -> Result<Status, ApiError> {
    delete_account(&pool, user_id).await?;
    Ok(Status::Ok)
}

pub async fn delete_account_by_session(
    pool: &Db,
    session_id: Uuid,
    rat: RefreshAccessToken,
) -> Result<(), ApiError> {
    let session = Session::get(&pool, &session_id).await?;
    let claims = Session::validate_token(&session, &rat)?;

    let is_valid = Session::is_valid(&pool, &claims, &session_id, &session.project_id).await?;

    if !is_valid {
        return Err(ApiError::Forbidden);
    }

    let user_id = session.user_id.ok_or(ApiError::BadRequest)?;

    User::remove(&pool, &user_id).await?;
    Ok(())
}

#[post("/delete_account/<session_id>", format = "json", data = "<rat>")]
pub async fn delete_account_handler(
    pool: Db,
    session_id: Uuid,
    rat: Json<RefreshAccessToken>,
) -> Result<Status, ApiError> {
    delete_account_by_session(&pool, session_id, rat.into_inner()).await?;
    Ok(Status::Ok)
}
