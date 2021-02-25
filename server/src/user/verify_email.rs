use crate::data::token;
use crate::data::verify_email::VerifyEmail;
use crate::data::AuthDb;
use crate::project::Project;
use crate::response::error::ApiError;

use chrono::{Duration, Utc};
use rocket::http::Status;
use rocket_contrib::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct Verify {
    pub id: Uuid,
    pub token: String,
}

#[post("/verify_email", data = "<body>")]
pub async fn handler(
    conn: AuthDb,
    body: Json<Verify>,
    _project: Project,
) -> Result<Status, ApiError> {
    let id = body.id;
    let verify = conn
        .run(move |client| VerifyEmail::get(client, &id))
        .await?;

    let is_valid = token::verify(&body.token, &verify.token)?;

    if is_valid == false {
        return Err(ApiError::ResetInvalidToken);
    }

    let expires_at = verify.created_at - Duration::minutes(30);
    if expires_at > Utc::now() {
        return Err(ApiError::ResetExpired);
    }

    conn.run(move |client| VerifyEmail::verify(client, &verify.user_id))
        .await?;

    Ok(Status::Ok)
}
