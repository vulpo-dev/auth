use crate::admin::data::{Admin, NewUser};
use crate::db::Db;
use crate::password;
use crate::response::error::ApiError;

use rocket;
use rocket::serde::json::Json;
use uuid::Uuid;

#[post("/__/create_user", format = "json", data = "<body>")]
pub async fn handler(
    pool: Db,
    body: Json<NewUser>,
    _admin: Admin,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    if body.provider_id == "password" {
        if let Some(password) = &body.password {
            password::validate_password_length(&password)?
        } else {
            return Err(ApiError::PasswordMinLength);
        }
    }

    Admin::create_user(&pool, body.into_inner())
        .await
        .map(|id| [id])
        .map(Json)
}
