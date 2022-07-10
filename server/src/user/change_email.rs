use crate::crypto::Token;
use crate::db::Db;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::session::data::AccessToken;
use crate::settings::data::ProjectEmail;
use crate::template::{Template, Templates};
use crate::user::data::{EmailChangeRequest, NewChangeRequest, User};

use chrono::Utc;
use rocket;
use rocket::futures::future::join;
use rocket::http::Status;
use rocket::serde::json::Json;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use super::data::EmailChangeState;

#[derive(Deserialize)]
pub struct EmailChangeRequestPayload {
    pub new_email: String,
}

pub async fn create_email_change_request(
    pool: &Db,
    new_email: &str,
    user_id: Uuid,
    project_id: Uuid,
) -> Result<(), ApiError> {
    let user = User::get_by_id(&pool, &user_id, &project_id)
        .await?
        .ok_or(ApiError::NotFound)?;

    let token = Token::create();
    let hashed_token = Token::hash(&token)?;

    let reset_token = Token::create();
    let hashed_reset_token = Token::hash(&reset_token)?;

    let change_request = NewChangeRequest {
        user_id,
        new_email: new_email.clone().to_string(),
        old_email: user.email.clone(),
        token: hashed_token,
        reset_token: hashed_reset_token,
    };

    let request_id = EmailChangeRequest::create(&pool, &change_request, &project_id).await?;

    let (settings, reset_settings) = join(
        ProjectEmail::from_project_template(&pool, &project_id, Templates::ConfirmEmailChange),
        ProjectEmail::from_project_template(&pool, &project_id, Templates::ChangeEmail),
    )
    .await;

    let confirm_settings = settings?;
    let reset_settings = reset_settings?;

    let confirm_link: String = format!(
        "{}{}?id={}&token={}",
        confirm_settings.domain, confirm_settings.redirect_to, request_id, token
    );

    let confirm_ctx = json!({
        "href": confirm_link,
        "project": confirm_settings.name.clone(),
        "user": Some(user.clone()),
        "expire_in": 15,
        "old_email": user.email.clone(),
        "new_email": new_email.clone(),
    });

    let reset_link: String = format!(
        "{}{}?id={}&token={}",
        reset_settings.domain, reset_settings.redirect_to, request_id, reset_token
    );

    let reset_ctx = json!({
        "href": reset_link,
        "project": reset_settings.name.clone(),
        "user": Some(user.clone()),
        "expire_in": 15,
        "old_email": user.email.clone(),
        "new_email": new_email.clone(),
    });

    let (confirm_email, reset_email) = join(
        Template::create_email(
            &pool,
            &project_id,
            &user.device_languages,
            &new_email,
            &confirm_ctx,
            &confirm_settings,
            Templates::ConfirmEmailChange,
        ),
        Template::create_email(
            &pool,
            &project_id,
            &user.device_languages,
            &user.email,
            &reset_ctx,
            &reset_settings,
            Templates::ChangeEmail,
        ),
    )
    .await;

    let confirm_email = confirm_email?;
    let reset_email = reset_email?;

    // make sure the reset email get's delivered first
    reset_email.send(reset_settings.email).await?;
    confirm_email.send(confirm_settings.email).await?;

    Ok(())
}

#[post("/email/update", format = "json", data = "<body>")]
pub async fn create_email_change_request_handler(
    pool: Db,
    body: Json<EmailChangeRequestPayload>,
    access_token: AccessToken,
    project: Project,
) -> Result<Status, ApiError> {
    let user_id = access_token.sub();
    create_email_change_request(&pool, &body.new_email, user_id, project.id).await?;
    Ok(Status::Ok)
}

#[derive(Deserialize)]
pub struct EmailChangeTokenPayload {
    pub id: Uuid,
    pub token: String,
}

pub async fn confirm_email_change(
    pool: &Db,
    body: EmailChangeTokenPayload,
) -> Result<(), ApiError> {
    let token = EmailChangeRequest::get_confirm_token(&pool, &body.id).await?;

    match token.state {
        EmailChangeState::Reject | EmailChangeState::Reset => return Err(ApiError::Forbidden),
        // todo: proper error code
        EmailChangeState::Accept => return Err(ApiError::Forbidden),
        EmailChangeState::Request => {}
    };

    if Utc::now() > token.expire_at {
        return Err(ApiError::Forbidden);
    }

    let is_valid = Token::verify(&body.token, &token.token)?;

    if !is_valid {
        return Err(ApiError::Forbidden);
    }

    EmailChangeRequest::set_email(&pool, &body.id).await?;

    Ok(())
}

#[post("/email/update/confirm", format = "json", data = "<body>")]
pub async fn confirm_email_change_handler(
    pool: Db,
    _access_token: AccessToken,
    body: Json<EmailChangeTokenPayload>,
) -> Result<Status, ApiError> {
    confirm_email_change(&pool, body.into_inner()).await?;
    Ok(Status::Ok)
}

pub async fn reset_email_change(pool: &Db, body: EmailChangeTokenPayload) -> Result<(), ApiError> {
    let token = EmailChangeRequest::get_reset_token(&pool, &body.id).await?;

    match token.state {
        EmailChangeState::Reject | EmailChangeState::Reset => return Err(ApiError::Forbidden),
        EmailChangeState::Accept | EmailChangeState::Request => {}
    };

    let is_valid = Token::verify(&body.token, &token.token)?;

    if !is_valid {
        return Err(ApiError::Forbidden);
    }

    EmailChangeRequest::reset_email(&pool, &body.id).await?;

    Ok(())
}

#[post("/email/update/reset", format = "json", data = "<body>")]
pub async fn reset_email_change_handler(
    pool: Db,
    _access_token: AccessToken,
    body: Json<EmailChangeTokenPayload>,
) -> Result<Status, ApiError> {
    reset_email_change(&pool, body.into_inner()).await?;
    Ok(Status::Ok)
}
