use crate::db::Db;
use crate::passwordless::data::Passwordless;
use crate::response::error::ApiError;

use chrono::Utc;
use rocket::http::Status;
use rocket::serde::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct ConfirmPasswordless {
    pub id: Uuid,
    pub token: String,
}

#[post("/confirm", format = "json", data = "<body>")]
pub async fn handler(pool: Db<'_>, body: Json<ConfirmPasswordless>) -> Result<Status, ApiError> {
    let token = Passwordless::get(pool.inner(), &body.id).await?;

    if token.is_valid == false {
        return Err(ApiError::PasswordlessInvalidToken);
    }

    if token.compare(&body.token) == false {
        return Err(ApiError::PasswordlessInvalidToken);
    }

    if Utc::now() > token.expire_at {
        return Err(ApiError::PasswordlessTokenExpire);
    }

    Passwordless::confirm(pool.inner(), &token.id).await?;

    Ok(Status::Ok)
}
