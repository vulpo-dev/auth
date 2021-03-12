use crate::admin::data::Admin;
use crate::db::AuthDb;
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
    conn: AuthDb,
    body: Json<Verify>,
    _project: Project,
) -> Result<Status, ApiError> {
    let id = body.id;
    let verify = conn
        .run(move |client| VerifyEmail::get(client, &id))
        .await?;

    let is_valid = Token::verify(&body.token, &verify.token)?;

    if is_valid == false {
        return Err(ApiError::TokenInvalid);
    }

    let expires_at = verify.created_at - Duration::minutes(30);
    if expires_at > Utc::now() {
        return Err(ApiError::ResetExpired);
    }

    conn.run(move |client| VerifyEmail::verify(client, &verify.user_id))
        .await?;

    Ok(Status::Ok)
}

#[derive(Deserialize)]
pub struct SendEmailVerification {
    pub user_id: Uuid,
    pub project_id: Uuid,
}

#[post("/send_email_verification", data = "<body>")]
pub async fn admin(
    conn: AuthDb,
    body: Json<SendEmailVerification>,
    _admin: Admin,
) -> Result<Status, ApiError> {
    let user_id = body.user_id.clone();
    let to_email = conn
        .run(move |client| VerifyEmail::unverify(client, &user_id))
        .await?;

    let project_id = body.project_id;
    let settings = conn
        .run(move |client| {
            ProjectEmail::from_project_template(client, project_id, Templates::VerifyEmail)
        })
        .await?;

    let reset_token = Token::create();
    let hashed_token = Token::hash(&reset_token)?;

    let user_id = body.user_id;
    let token_id = conn
        .run(move |client| VerifyEmail::insert(client, &user_id, hashed_token))
        .await?;

    let link: String = format!(
        "{}{}?id={}&token={}",
        settings.domain, settings.redirect_to, token_id, reset_token
    );

    let ctx = TemplateCtx {
        href: link,
        project: settings.name,
        user: None,
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
