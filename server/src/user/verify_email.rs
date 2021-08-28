use crate::admin::data::Admin;
use crate::db::Db;
use crate::mail::data::VerifyEmail;
use crate::mail::Email;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::session::data::Token;
use crate::settings::data::ProjectEmail;
use crate::template::{Template, TemplateCtx, Templates};

use chrono::Utc;
use rocket::http::Status;
use rocket::serde::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct Verify {
    pub id: Uuid,
    pub token: String,
}

#[post("/verify_email", format = "json", data = "<body>")]
pub async fn handler(
    pool: Db<'_>,
    body: Json<Verify>,
    _project: Project,
) -> Result<Status, ApiError> {
    let verify = VerifyEmail::get(pool.inner(), &body.id).await?;

    let is_valid = Token::verify(&body.token, &verify.token)?;

    if is_valid == false {
        return Err(ApiError::TokenInvalid);
    }

    if Utc::now() > verify.expire_at {
        return Err(ApiError::TokenExpired);
    }

    VerifyEmail::verify(pool.inner(), &verify.user_id).await?;

    Ok(Status::Ok)
}

#[derive(Deserialize)]
pub struct SendEmailVerification {
    pub user_id: Uuid,
    pub project_id: Uuid,
}

#[post("/send_email_verification", format = "json", data = "<body>")]
pub async fn admin(
    pool: Db<'_>,
    body: Json<SendEmailVerification>,
    _admin: Admin,
) -> Result<Status, ApiError> {
    send_email_verification(&pool, body.into_inner()).await?;
    Ok(Status::Ok)
}

pub async fn send_email_verification(
    pool: &Db<'_>,
    body: SendEmailVerification,
) -> Result<(), ApiError> {
    let to_email = VerifyEmail::unverify(pool.inner(), &body.user_id).await?;
    send(&pool, &body.user_id, &body.project_id, &to_email).await
}

pub async fn send(
    pool: &Db<'_>,
    user_id: &Uuid,
    project_id: &Uuid,
    to_email: &String,
) -> Result<(), ApiError> {
    let settings =
        ProjectEmail::from_project_template(pool.inner(), &project_id, Templates::VerifyEmail)
            .await?;

    let reset_token = Token::create();
    let hashed_token = Token::hash(&reset_token)?;
    let token_id = VerifyEmail::insert(pool.inner(), &user_id, hashed_token, &project_id).await?;

    let link: String = format!(
        "{}{}?id={}&token={}",
        settings.domain, settings.redirect_to, token_id, reset_token
    );

    let ctx = TemplateCtx {
        href: link,
        project: settings.name,
        user: None,
    };

    let content = Template::render(settings.body, ctx).map_err(|_| ApiError::TemplateRender)?;
    let email = Email {
        to_email: to_email.to_string(),
        subject: settings.subject,
        content,
    };

    email.send(settings.email).await?;

    Ok(())
}
