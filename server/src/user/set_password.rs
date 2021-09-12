use crate::db::Db;
use crate::mail::Email;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::session::data::AccessToken;
use crate::settings::data::ProjectEmail;
use crate::user::data::User;
use crate::password;
use crate::template::{Template, TemplateCtx, Templates, Translations};

use rocket::serde::json::Json;
use rocket::http::Status;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct Payload {
    pub password: String,
}

#[post("/set_password", format="json", data="<body>")]
pub async fn set_password(
    pool: Db,
    project: Project,
    token: AccessToken,
    body: Json<Payload>
) -> Result<Status, ApiError> {
    let user_id = token.sub();
    let user = User::get_by_id(&pool, &user_id, &project.id).await?;

    if user.state != "SetPassword" {
        return Err(ApiError::Forbidden);
    }

    password::validate_password_length(&body.password)?;

    User::set_password(&pool, &user_id, &body.password).await?;

    let settings =
        ProjectEmail::from_project_template(&pool, &project.id, Templates::PasswordReset).await?;

    let link: String = format!(
        "{}{}?email={}",
        settings.domain, settings.redirect_to, user.email
    );

    let user_email = user.email.clone();
    let device_languages = user.device_languages.clone();

    let ctx = TemplateCtx {
        href: link,
        project: settings.name,
        user: Some(user),
        expire_in: 15,
    };

    let translations = Translations::get_by_languages(
        &pool,
        &project.id,
        &device_languages,
        &Templates::PasswordChanged.to_string(),
    )
    .await?;

    let translations = Template::translate(&translations, &ctx);
    let subject = Template::render_subject(&settings.subject, &translations)?;
    let content = Template::render(&pool, settings.body, ctx, &translations).await?;

    let email = Email {
        to_email: user_email,
        subject,
        content,
    };

    email.send(settings.email).await?;

    Ok(Status::Ok)
}
