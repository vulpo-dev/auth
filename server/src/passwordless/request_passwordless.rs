use crate::db::{AuthDb, Db};
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
use rocket_contrib::json::Json;
use serde::{Deserialize, Serialize};
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

#[post("/", data = "<body>")]
pub async fn request_passwordless(
    conn: AuthDb,
    pool: Db<'_>,
    project: Project,
    body: Json<RequestPasswordless>,
) -> Result<Json<PasswordlessResponse>, ApiError> {
    Flags::has_flags(pool.inner(), &project.id, &[Flags::AuthenticationLink]).await?;

    let body_email = body.email.trim().to_lowercase();

    let email = body_email.clone();
    let user = conn
        .run(move |client| User::get_by_email(client, &email, project.id))
        .await?;

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

    let email = body_email.clone();
    let session_id = body.session.clone();
    let id = Passwordless::create_token(
        pool.inner(),
        user_id,
        &email,
        &hashed_token,
        &project.id,
        &session_id,
    )
    .await?;

    let settings = conn
        .run(move |client| {
            ProjectEmail::from_project_template(client, project.id, Templates::Passwordless)
        })
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

    let content = match Template::render(settings.body, ctx) {
        Err(_) => return Err(ApiError::TemplateRender),
        Ok(v) => v,
    };

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
