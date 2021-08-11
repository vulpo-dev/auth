use crate::db::Db;
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
use rocket::serde::{json::Json, Deserialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct RequestPasswordReset {
    pub email: String,
}

#[post("/request_password_reset", format = "json", data = "<body>")]
pub async fn request_password_reset(
    pool: Db<'_>,
    body: Json<RequestPasswordReset>,
    project: Project,
) -> Result<Status, ApiError> {
    let to_email = body.email.trim().to_lowercase();
    let row = User::get_by_email(pool.inner(), &to_email, project.id).await;

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
    let token_id = PasswordReset::insert(pool.inner(), &user.id, &project.id, hashed_token).await?;

    let settings =
        ProjectEmail::from_project_template(pool.inner(), &project.id, Templates::PasswordReset)
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
        to_email,
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
    pool: Db<'_>,
    body: Json<ResetPassword>,
    _project: Project,
) -> Result<Status, ApiError> {
    if body.password1 != body.password2 {
        return Err(ApiError::ResetPasswordMismatch);
    }

    validate_password_length(&body.password1)?;

    let reset = PasswordReset::get(pool.inner(), &body.id).await?;

    let is_valid = Token::verify(&body.token, &reset.token)?;

    if is_valid == false {
        return Err(ApiError::ResetInvalidToken);
    }

    let expires_at = reset.created_at + Duration::minutes(30);
    if Utc::now() > expires_at {
        return Err(ApiError::ResetExpired);
    }

    // todo: move "remove password reset token" into "set_password" query
    PasswordReset::remove(pool.inner(), &reset.user_id).await?;
    User::set_password(pool.inner(), &reset.user_id, &body.password1).await?;

    Ok(Status::Ok)
}

#[derive(Deserialize)]
pub struct VerifyToken {
    pub id: Uuid,
    pub token: String,
}

#[post("/verify_reset_token", data = "<body>")]
pub async fn verify_token(
    pool: Db<'_>,
    body: Json<VerifyToken>,
    _project: Project,
) -> Result<Status, ApiError> {
    let id = body.id;
    let reset = PasswordReset::get(pool.inner(), &id).await?;

    let is_valid = Token::verify(&body.token, &reset.token)?;

    if is_valid == false {
        return Err(ApiError::ResetInvalidToken);
    }

    let expires_at = reset.created_at + Duration::minutes(30);
    if Utc::now() > expires_at {
        return Err(ApiError::ResetExpired);
    }

    Ok(Status::Ok)
}
