use crate::crypto::Token;
use crate::mail::Email;
use crate::passwordless::data::Passwordless;
use crate::project::data::Flags;
use crate::project::Project;
use crate::session::data::Session;
use crate::settings::data::ProjectEmail;
use crate::template::{Template, TemplateCtx, Templates, Translations};
use crate::user::data::{User, UserState};

use chrono::{Duration, Utc};
use rocket::serde::{json::Json, Deserialize, Serialize};
use uuid::Uuid;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

#[derive(Deserialize)]
pub struct RequestPasswordless {
    pub email: String,
    pub session: Uuid,
    pub public_key: Vec<u8>,
    pub device_languages: Vec<String>,
}

#[derive(Serialize)]
pub struct PasswordlessResponse {
    pub id: Uuid,
    pub session: Uuid,
}

pub async fn request_passwordless(
    pool: &Db,
    request: RequestPasswordless,
    project_id: Uuid,
) -> Result<PasswordlessResponse, ApiError> {
    let body_email = request.email.trim().to_lowercase();

    let user = User::get_by_email(&pool, &body_email, &project_id).await?;

    if user
        .clone()
        .map_or(false, |u| u.state == UserState::Disabled)
    {
        return Err(ApiError::UserDisabled);
    }

    let user_id = user.clone().map(|u| u.id);

    let session = Session {
        id: request.session,
        public_key: request.public_key.to_owned(),
        user_id,
        expire_at: Utc::now() + Duration::days(30),
        project_id,
    };

    let session = Session::create(&pool, session).await?;

    let verification_token = Token::create();
    let hashed_token = Token::hash(&verification_token)?;

    let id = Passwordless::create_token(
        &pool,
        user_id,
        &body_email,
        &hashed_token,
        &project_id,
        &request.session,
    )
    .await?;

    let settings =
        ProjectEmail::from_project_template(&pool, &project_id, Templates::Passwordless).await?;

    let link: String = format!(
        "{}{}?id={}&token={}",
        settings.domain, settings.redirect_to, id, verification_token
    );

    let ctx = TemplateCtx {
        href: link,
        project: settings.name,
        user,
        expire_in: 15,
    };

    let translations = Translations::get_by_languages(
        &pool,
        &project_id,
        &request.device_languages,
        &Templates::Passwordless.to_string(),
    )
    .await?;

    let translations = Template::translate(&translations, &ctx);
    let subject = Template::render_subject(&settings.subject, &translations)?;
    let content = Template::render(&pool, &settings.body, &ctx, &translations).await?;

    let email = Email {
        to_email: request.email.to_owned(),
        subject,
        content,
    };

    email.send(settings.email).await?;

    Ok(PasswordlessResponse {
        id,
        session: session.id,
    })
}

#[post("/", format = "json", data = "<body>")]
pub async fn handler(
    pool: Db,
    project: Project,
    body: Json<RequestPasswordless>,
) -> Result<Json<PasswordlessResponse>, ApiError> {
    Flags::has_flags(&pool, &project.id, &[Flags::AuthenticationLink]).await?;
    let response = request_passwordless(&pool, body.into_inner(), project.id).await?;
    Ok(Json(response))
}
