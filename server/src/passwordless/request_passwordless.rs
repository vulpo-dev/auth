use crate::data::project::Flags;
use crate::data::token::Passwordless;
use crate::data::user::User;
use crate::data::AuthDb;
use crate::mail::Email;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::settings::data::ProjectEmail;
use crate::template::{Template, TemplateCtx, Templates};

use rocket_contrib::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct RequestPasswordless {
    pub email: String,
}

#[post("/", data = "<body>")]
pub async fn request_passwordless(
    conn: AuthDb,
    project: Project,
    body: Json<RequestPasswordless>,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    conn.run(move |client| Flags::has_flags(client, &project.id, &[Flags::AuthenticationLink]))
        .await?;

    let body_email = body.email.trim().to_lowercase();

    let email = body_email.clone();
    let user = conn
        .run(move |client| User::get_by_email(client, &email, project.id))
        .await?;

    let token = Passwordless::get_token();
    let verification_token = Passwordless::hash_token(&token)?;

    let email = body_email.clone();
    let user_id = user.clone().map(|u| u.id);
    let id = conn
        .run(move |client| {
            Passwordless::create_token(client, user_id, &email, &verification_token, project.id)
        })
        .await?;

    let settings = conn
        .run(move |client| {
            ProjectEmail::from_project_template(client, project.id, Templates::Passwordless)
        })
        .await?;

    let link: String = format!(
        "{}{}?id={}&token={}",
        settings.domain, settings.redirect_to, id, token
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

    Ok(Json([id]))
}
