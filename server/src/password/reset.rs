use crate::data::password_reset::PasswordReset;
use crate::data::user::User;
use crate::data::AuthDb;
use crate::password::validate_password_length;
use crate::project::Project;
use crate::response::error::ApiError;

use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use rocket::http::Status;
use rocket_contrib::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct RequestPasswordReset {
    pub email: String,
}

#[post("/request_password_reset", data = "<body>")]
pub async fn request_password_reset(
    conn: AuthDb,
    body: Json<RequestPasswordReset>,
    project: Project,
) -> Result<Status, ApiError> {
    let row = conn
        .run(move |client| User::get_by_email(client, body.email.to_string(), project.id))
        .await;

    let user = match row {
        Err(_) => return Ok(Status::Ok),
        Ok(user) => user,
    };

    let reset_token = Uuid::new_v4();
    let hashed_token = match hash(reset_token.to_string(), DEFAULT_COST) {
        Err(_) => return Err(ApiError::InternalServerError),
        Ok(hashed) => hashed,
    };

    let token_id = conn
        .run(move |client| PasswordReset::insert(client, &user.id, hashed_token.to_string()))
        .await?;

    println!("Id: {:?}", token_id);
    println!("Reset Token: {:?}", reset_token);
    println!("Project: {:?}", project.id);

    Ok(Status::Ok)
}

#[derive(Deserialize)]
pub struct ResetPassword {
    pub id: Uuid,
    pub token: Uuid,
    pub password1: String,
    pub password2: String,
}

#[post("/password_reset", data = "<body>")]
pub async fn password_reset(
    conn: AuthDb,
    body: Json<ResetPassword>,
    _project: Project,
) -> Result<Status, ApiError> {
    if body.password1 != body.password2 {
        return Err(ApiError::ResetPasswordMismatch);
    }

    validate_password_length(&body.password1)?;

    let id = body.id;
    let reset = conn
        .run(move |client| PasswordReset::get(client, &id))
        .await?;

    let is_valid = match verify(body.token.to_string(), &reset.token) {
        Err(_) => return Err(ApiError::InternalServerError),
        Ok(valid) => valid,
    };

    if is_valid == false {
        return Err(ApiError::ResetInvalidToken);
    }

    let expires_at = reset.created_at - Duration::minutes(30);
    if expires_at > Utc::now() {
        return Err(ApiError::ResetExpired);
    }

    let password = body.password1.clone();
    conn.run(move |client| {
        let mut trx = match client.transaction() {
            Err(_) => return Err(ApiError::InternalServerError),
            Ok(con) => con,
        };

        PasswordReset::remove(&mut trx, &reset.user_id)?;
        User::set_password(&mut trx, reset.user_id, password)?;

        if let Err(_) = trx.commit() {
            return Err(ApiError::InternalServerError);
        }

        Ok(())
    })
    .await?;

    Ok(Status::Ok)
}
