use crate::admin::data::Admin;
use crate::db::Db;
use crate::response::error::ApiError;

use crate::session::data::{RefreshAccessToken, Session};
use crate::user::data::User;

use rocket;
use rocket::serde::json::Json;
use rocket::serde::uuid::Uuid;

#[post("/admin/delete_account/<user_id>")]
pub async fn admin_delete_account(pool: Db, user_id: Uuid, _admin: Admin) -> Result<(), ApiError> {
    User::remove(&pool, &user_id).await?;
    Ok(())
}

#[post("/delete_account/<session_id>", format = "json", data = "<rat>")]
pub async fn delete_account(
    pool: Db,
    session_id: Uuid,
    rat: Json<RefreshAccessToken>,
) -> Result<(), ApiError> {
    let session = Session::get(&pool, &session_id).await?;
    let claims = Session::validate_token(&session, &rat)?;

    let is_valid = Session::is_valid(&pool, &claims, &session_id, &session.project_id).await?;

    if !is_valid {
        return Err(ApiError::Forbidden);
    }

    User::remove(&pool, &session.user_id.unwrap()).await?;

    Ok(())
}
