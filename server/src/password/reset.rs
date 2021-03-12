use crate::db::AuthDb;
use crate::mail::Email;
use crate::password::data::PasswordReset;
use crate::password::validate_password_length;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::session::data::Token;
use crate::settings::data::ProjectEmail;
use crate::template::{Template, TemplateCtx, Templates};
use crate::user::data::User;

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

    let reset_token = Token::create();
    let hashed_token = Token::hash(&reset_token)?;

    let user_id = user.clone().id;
    let token_id = conn
        .run(move |client| PasswordReset::insert(client, &user_id, hashed_token))
        .await?;

    let settings = conn
        .run(move |client| {
            ProjectEmail::from_project_template(client, project.id, Templates::PasswordReset)
        })
        .await?;

    let link: String = format!(
        "{}{}?id={}&token={}",
        settings.domain, settings.redirect_to, token_id, reset_token
    );

    let ctx = TemplateCtx {
        href: link,
        project: settings.name,
        user: Some(user),
    };

    let content = match Template::render(settings.body, ctx) {
        Err(_) => return Err(ApiError::TemplateRender),
        Ok(v) => v,
    };

    let email = Email {
        to_email: body.email.clone(),
        subject: settings.subject,
        content,
    };

    email.send(settings.email).await?;

    Ok(Status::Ok)
}

#[derive(Deserialize)]
pub struct ResetPassword {
    pub id: Uuid,
    pub token: String,
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

    let is_valid = Token::verify(&body.token, &reset.token)?;

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

#[derive(Deserialize)]
pub struct VerifyToken {
    pub id: Uuid,
    pub token: String,
}

#[post("/verify_reset_token", data = "<body>")]
pub async fn verify_token(
    conn: AuthDb,
    body: Json<VerifyToken>,
    _project: Project,
) -> Result<Status, ApiError> {
    let id = body.id;
    let reset = conn
        .run(move |client| PasswordReset::get(client, &id))
        .await?;

    let is_valid = Token::verify(&body.token, &reset.token)?;

    if is_valid == false {
        return Err(ApiError::ResetInvalidToken);
    }

    let expires_at = reset.created_at - Duration::minutes(30);
    if expires_at > Utc::now() {
        return Err(ApiError::ResetExpired);
    }

    Ok(Status::Ok)
}
