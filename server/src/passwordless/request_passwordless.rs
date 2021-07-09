use crate::db::Db;
use crate::mail::Email;
use crate::passwordless::data::Passwordless;
use crate::project::data::Flags;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::session::data::Session;
use crate::session::data::Token;
use crate::settings::data::ProjectEmail;
use crate::template::{Template, TemplateCtx, Templates};
use crate::user::data::User;

use chrono::{Duration, Utc};
use rocket::serde::{json::Json, Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct RequestPasswordless {
    pub email: String,
    pub session: Uuid,
    pub public_key: Vec<u8>,
}

#[derive(Serialize)]
pub struct PasswordlessResponse {
    pub id: Uuid,
    pub session: Uuid,
}

#[post("/", format = "json", data = "<body>")]
pub async fn request_passwordless(
    pool: Db<'_>,
    project: Project,
    body: Json<RequestPasswordless>,
) -> Result<Json<PasswordlessResponse>, ApiError> {
    Flags::has_flags(pool.inner(), &project.id, &[Flags::AuthenticationLink]).await?;

    let body_email = body.email.trim().to_lowercase();

    let user = User::get_by_email(pool.inner(), &body_email, project.id).await?;

    if user.clone().map_or(false, |u| u.disabled) {
        return Err(ApiError::UserDisabled);
    }

    let user_id = user.clone().map(|u| u.id);

    let session = Session {
        id: body.session,
        public_key: body.public_key.to_owned(),
        user_id,
        expire_at: Utc::now() + Duration::days(30),
    };

    let session = Session::create(pool.inner(), session).await?;

    let verification_token = Token::create();
    let hashed_token = Token::hash(&verification_token)?;

    let id = Passwordless::create_token(
        pool.inner(),
        user_id,
        &body_email,
        &hashed_token,
        &project.id,
        &body.session,
    )
    .await?;

    let settings =
        ProjectEmail::from_project_template(pool.inner(), &project.id, Templates::Passwordless)
            .await?;

    let link: String = format!(
        "{}{}?id={}&token={}",
        settings.domain, settings.redirect_to, id, verification_token
    );

    let ctx = TemplateCtx {
        href: link,
        project: settings.name,
        user,
    };

    let content = Template::render(settings.body, ctx).map_err(|_| ApiError::TemplateRender)?;

    let email = Email {
        to_email: body.email.to_owned(),
        subject: settings.subject,
        content,
    };

    email.send(settings.email).await?;

    Ok(Json(PasswordlessResponse {
        id,
        session: session.id,
    }))
}
