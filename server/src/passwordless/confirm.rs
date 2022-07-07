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
pub async fn handler(pool: Db, body: Json<ConfirmPasswordless>) -> Result<Status, ApiError> {
    let token = Passwordless::get(&pool, &body.id)
        .await?
        .ok_or_else(|| ApiError::NotFound)?;

    if token.is_valid == false {
        return Err(ApiError::PasswordlessInvalidToken);
    }

    if token.compare(&body.token) == false {
        return Err(ApiError::PasswordlessInvalidToken);
    }

    if Utc::now() > token.expire_at {
        return Err(ApiError::PasswordlessTokenExpire);
    }

    Passwordless::confirm(&pool, &token.id).await?;

    Ok(Status::Ok)
}
