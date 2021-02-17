use crate::data::password_reset::PasswordReset;
use crate::data::user::User;
use crate::data::AuthDb;
use crate::mail::Email;
use crate::password::validate_password_length;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::settings::data::ProjectEmail;
use crate::template::Template;

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
    let email = body.email.clone().trim().to_lowercase();
    let row = conn
        .run(move |client| User::get_by_email(client, &email, project.id))
        .await;

    let user = match row {
        Err(_) => return Ok(Status::Ok),
        Ok(user) => user,
    };

    let user = match user {
        None => return Ok(Status::Ok),
        Some(user) => user,
    };

    let reset_token = Uuid::new_v4();
    let hashed_token = match hash(reset_token.to_string(), DEFAULT_COST) {
        Err(_) => return Err(ApiError::InternalServerError),
        Ok(hashed) => hashed,
    };

    let token_id = conn
        .run(move |client| PasswordReset::insert(client, &user.id, hashed_token.to_string()))
        .await?;

    let settings = conn
        .run(move |client| ProjectEmail::from_project(client, project.id))
        .await?;

    let base_url = "http://localhost:3000".to_string();
    let link: String = format!("{}?id={}&token={}", base_url, token_id, reset_token);

    let content = Template::password_reset(link);

    let email = Email {
        to_email: body.email.clone(),
        subject: String::from("Reset Password"),
        content,
    };

    match settings {
        None => return Err(ApiError::InternalServerError),
        Some(settings) => email.send(settings).await?,
    };

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
