use crate::admin::data::Admin;
use crate::db::Db;
use crate::response::error::ApiError;
use crate::session::data::Token;
use crate::session::data::{RefreshAccessToken, Session};
use crate::user::data::User;

use rocket;
use rocket_contrib::json::Json;
use rocket_contrib::uuid::Uuid;

#[post("/delete_account/<user_id>")]
pub async fn admin_delete_account(
    pool: Db<'_>,
    user_id: Uuid,
    _admin: Admin,
) -> Result<(), ApiError> {
    let user_id = user_id.into_inner();
    User::remove(pool.inner(), &user_id).await?;
    Ok(())
}

#[post("/delete_account/<session_id>", data = "<rat>", rank = 2)]
pub async fn delete_account(
    pool: Db<'_>,
    session_id: Uuid,
    rat: Json<RefreshAccessToken>,
) -> Result<(), ApiError> {
    let session = Session::get(pool.inner(), &session_id.into_inner()).await?;
    let claims = Session::validate_token(&session, &rat)?;

    let is_valid = Token::is_valid(pool.inner(), &claims, &session_id.into_inner()).await?;

    if !is_valid {
        return Err(ApiError::Forbidden);
    }

    User::remove_by_token(pool.inner(), &session.user_id.unwrap()).await?;

    Ok(())
}
