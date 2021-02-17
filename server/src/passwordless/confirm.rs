use crate::data::token::Passwordless;
use crate::data::AuthDb;
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
pub async fn handler(conn: AuthDb, body: Json<ConfirmPasswordless>) -> Result<Status, ApiError> {
    let id = body.id.clone();
    let token = conn
        .run(move |client| Passwordless::get(client, &id))
        .await?;

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

    conn.run(move |client| Passwordless::confirm(client, &token.id))
        .await?;

    Ok(Status::Ok)
}
