use crate::passwordless::data::Passwordless;
use crate::response::error::ApiError;

use chrono::Utc;
use rocket::http::Status;
use rocket::serde::json::Json;
use serde::Deserialize;
use uuid::Uuid;
use werkbank::rocket::Db;

#[derive(Deserialize)]
pub struct ConfirmPasswordless {
    pub id: Uuid,
    pub token: String,
}

pub async fn confirm(pool: &Db, id: &Uuid, token: &str) -> Result<(), ApiError> {
    let stored_token = Passwordless::get(&pool, id)
        .await?
        .ok_or_else(|| ApiError::NotFound)?;

    if stored_token.is_valid == false {
        return Err(ApiError::PasswordlessInvalidToken);
    }

    if stored_token.compare(token) == false {
        return Err(ApiError::PasswordlessInvalidToken);
    }

    if Utc::now() > stored_token.expire_at {
        return Err(ApiError::PasswordlessTokenExpire);
    }

    Passwordless::confirm(&pool, &stored_token.id).await?;
    Ok(())
}

#[post("/confirm", format = "json", data = "<body>")]
pub async fn handler(pool: Db, body: Json<ConfirmPasswordless>) -> Result<Status, ApiError> {
    confirm(&pool, &body.id, &body.token).await?;
    Ok(Status::Ok)
}
