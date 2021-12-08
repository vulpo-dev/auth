use crate::crypto::Token;
use crate::db::Db;
use crate::mail::Email;
use crate::password::data::PasswordReset;
use crate::password::validate_password_length;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::settings::data::ProjectEmail;
use crate::template::{Template, TemplateCtx, Templates, Translations};
use crate::user::data::User;

use chrono::Utc;
use rocket::http::Status;
use rocket::serde::{json::Json, Deserialize};
use uuid::Uuid;

use super::data::Password;

#[derive(Deserialize)]
pub struct RequestPasswordReset {
    pub email: String,
}

#[post("/request_password_reset", format = "json", data = "<body>")]
pub async fn request_password_reset(
    pool: Db,
    body: Json<RequestPasswordReset>,
    project: Project,
) -> Result<Status, ApiError> {
    let to_email = body.email.trim().to_lowercase();
    let row = User::get_by_email(&pool, &to_email, &project.id).await;

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
    let token_id = PasswordReset::insert(&pool, &user.id, &project.id, hashed_token).await?;

    let settings =
        ProjectEmail::from_project_template(&pool, &project.id, Templates::PasswordReset).await?;

    let link: String = format!(
        "{}{}?id={}&token={}",
        settings.domain, settings.redirect_to, token_id, reset_token
    );

    let user_id = user.id.clone();
    let ctx = TemplateCtx {
        href: link,
        project: settings.name,
        user: Some(user),
        expire_in: 15,
    };

    let translations =
        Translations::get_by_user(&pool, &user_id, &Templates::PasswordReset.to_string()).await?;

    let translations = Template::translate(&translations, &ctx);
    let subject = Template::render_subject(&settings.subject, &translations)?;
    let content = Template::render(&pool, &settings.body, &ctx, &translations).await?;

    let email = Email {
        to_email,
        subject,
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
    pool: Db,
    body: Json<ResetPassword>,
    _project: Project,
) -> Result<Status, ApiError> {
    if body.password1 != body.password2 {
        return Err(ApiError::ResetPasswordMismatch);
    }

    validate_password_length(&body.password1)?;

    let reset = PasswordReset::get(&pool, &body.id).await?;

    let is_valid = Token::verify(&body.token, &reset.token)?;

    if is_valid == false {
        return Err(ApiError::ResetInvalidToken);
    }

    if Utc::now() > reset.expire_at {
        return Err(ApiError::ResetExpired);
    }

    // todo: move "remove password reset token" into "set_password" query
    PasswordReset::remove(&pool, &reset.user_id).await?;
    Password::set_password(&pool, &reset.user_id, &body.password1).await?;

    Ok(Status::Ok)
}

#[derive(Deserialize)]
pub struct VerifyToken {
    pub id: Uuid,
    pub token: String,
}

#[post("/verify_reset_token", data = "<body>")]
pub async fn verify_token(
    pool: Db,
    body: Json<VerifyToken>,
    _project: Project,
) -> Result<Status, ApiError> {
    let id = body.id;
    let reset = PasswordReset::get(&pool, &id).await?;

    let is_valid = Token::verify(&body.token, &reset.token)?;

    if is_valid == false {
        return Err(ApiError::ResetInvalidToken);
    }

    if Utc::now() > reset.expire_at {
        return Err(ApiError::ResetExpired);
    }

    Ok(Status::Ok)
}
