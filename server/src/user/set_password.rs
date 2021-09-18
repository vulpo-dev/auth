use crate::db::Db;
use crate::project::Project;
use crate::project::data::Project as ProjectData;
use crate::response::error::ApiError;
use crate::session::data::AccessToken;
use crate::settings::data::ProjectEmail;
use crate::user::data::User;
use crate::password;
use crate::template::{Template, TemplateCtx, Templates};

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
        ProjectEmail::from_project_template(&pool, &project.id, Templates::PasswordReset).await;

    if let Err(err) = settings {
        let is_admin = ProjectData::is_admin(&pool, &project.id).await?;
        if is_admin {
            return Ok(Status::Ok);
        } else {
            return Err(err);
        }
    }

    let settings = settings.unwrap();

    let link: String = format!(
        "{}{}?email={}",
        settings.domain, settings.redirect_to, user.email
    );

    let user_email = user.email.clone();
    let device_languages = user.device_languages.clone();

    let ctx = TemplateCtx {
        href: link,
        project: settings.name.clone(),
        user: Some(user),
        expire_in: 15,
    };

    let email = Template::create_email(&pool, &project.id, &device_languages, &user_email, &ctx, &settings, Templates::PasswordChanged).await?;

    email.send(settings.email).await?;

    Ok(Status::Ok)
}
