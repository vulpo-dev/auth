use crate::db::Db;
use crate::passwordless::data::Passwordless;
use crate::response::error::ApiError;

use chrono::{Duration, Utc};
use rocket::http::Status;
use rocket_contrib::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct ConfirmPasswordless {
    pub id: Uuid,
    pub token: String,
}

#[post("/confirm", data = "<body>")]
pub async fn handler(pool: Db<'_>, body: Json<ConfirmPasswordless>) -> Result<Status, ApiError> {
    let token = Passwordless::get(pool.inner(), &body.id).await?;

    if token.is_valid == false {
        return Err(ApiError::PasswordlessInvalidToken);
    }

    if token.compare(&body.token) == false {
        return Err(ApiError::PasswordlessInvalidToken);
    }

    let expires_at = token.created_at - Duration::minutes(30);
    if expires_at > Utc::now() {
        return Err(ApiError::PasswordlessTokenExpire);
    }

    Passwordless::confirm(pool.inner(), &token.id).await?;

    Ok(Status::Ok)
}
