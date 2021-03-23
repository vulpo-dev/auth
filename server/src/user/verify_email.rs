use crate::admin::data::Admin;
use crate::db::Db;
use crate::mail::data::VerifyEmail;
use crate::mail::Email;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::session::data::Token;
use crate::settings::data::ProjectEmail;
use crate::template::{Template, TemplateCtx, Templates};

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
    pool: Db<'_>,
    body: Json<Verify>,
    _project: Project,
) -> Result<Status, ApiError> {
    let verify = VerifyEmail::get(pool.inner(), &body.id).await?;

    let is_valid = Token::verify(&body.token, &verify.token)?;

    if is_valid == false {
        return Err(ApiError::TokenInvalid);
    }

    let expires_at = verify.created_at - Duration::minutes(30);
    if expires_at > Utc::now() {
        return Err(ApiError::ResetExpired);
    }

    VerifyEmail::verify(pool.inner(), &verify.user_id).await?;

    Ok(Status::Ok)
}

#[derive(Deserialize)]
pub struct SendEmailVerification {
    pub user_id: Uuid,
    pub project_id: Uuid,
}

#[post("/send_email_verification", data = "<body>")]
pub async fn admin(
    pool: Db<'_>,
    body: Json<SendEmailVerification>,
    _admin: Admin,
) -> Result<Status, ApiError> {
    let to_email = VerifyEmail::unverify(pool.inner(), &body.user_id).await?;

    let settings =
        ProjectEmail::from_project_template(pool.inner(), &body.project_id, Templates::VerifyEmail)
            .await?;

    let reset_token = Token::create();
    let hashed_token = Token::hash(&reset_token)?;
    let token_id =
        VerifyEmail::insert(pool.inner(), &body.user_id, hashed_token, &body.project_id).await?;

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
        to_email,
        subject: settings.subject,
        content,
    };

    email.send(settings.email).await?;

    Ok(Status::Ok)
}
