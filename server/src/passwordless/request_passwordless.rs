use crate::data::project::Flags;
use crate::data::session::Session;
use crate::data::user::User;
use crate::data::AuthDb;
use crate::data::{token, token::Passwordless};
use crate::mail::Email;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::settings::data::ProjectEmail;
use crate::template::{Template, TemplateCtx, Templates};

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
    project: Project,
    body: Json<RequestPasswordless>,
) -> Result<Json<PasswordlessResponse>, ApiError> {
    conn.run(move |client| Flags::has_flags(client, &project.id, &[Flags::AuthenticationLink]))
        .await?;

    let body_email = body.email.trim().to_lowercase();

    let email = body_email.clone();
    let user = conn
        .run(move |client| User::get_by_email(client, &email, project.id))
        .await?;

    let user_id = user.clone().map(|u| u.id);
    let session_id = body.session.clone();
    let public_key = body.public_key.clone();
    let session = conn
        .run(move |client| {
            let session = Session {
                id: session_id,
                public_key,
                user_id,
                expire_at: Utc::now() + Duration::minutes(30),
            };

            Session::create(client, session)
        })
        .await?;

    let verification_token = token::create();
    let hashed_token = token::hash(&verification_token)?;

    let email = body_email.clone();
    let user_id = user.clone().map(|u| u.id);
    let session_id = body.session.clone();
    let id = conn
        .run(move |client| {
            Passwordless::create_token(
                client,
                user_id,
                &email,
                &hashed_token,
                &project.id,
                &session_id,
            )
        })
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
        to_email: body.email.clone(),
        subject: settings.subject,
        content,
    };

    email.send(settings.email).await?;

    Ok(Json(PasswordlessResponse {
        id,
        session: session.id,
    }))
}
