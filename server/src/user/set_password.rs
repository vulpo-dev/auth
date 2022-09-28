use crate::password;
use crate::password::data::Password;
use crate::project::data::Project as ProjectData;
use crate::project::Project;
use crate::session::data::AccessToken;
use crate::settings::data::ProjectEmail;
use crate::template::{Template, TemplateCtx, Templates};
use crate::user::data::{User, UserState};

use rocket::http::Status;
use rocket::serde::json::Json;
use serde::Deserialize;
use uuid::Uuid;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

#[derive(Deserialize)]
pub struct Payload {
    pub password: String,
}

pub async fn set_password(
    pool: &Db,
    user_id: Uuid,
    project_id: Uuid,
    body: Payload,
) -> Result<(), ApiError> {
    let user = User::get_by_id(&pool, &user_id, &project_id)
        .await?
        .ok_or_else(|| ApiError::NotFound)?;

    if user.state != UserState::SetPassword {
        return Err(ApiError::Forbidden);
    }

    password::validate_password_length(&body.password)?;

    let alg = ProjectData::password_alg(&pool, &project_id).await?;
    Password::set_password(&pool, &user_id, &body.password, &alg, &project_id).await?;

    let settings =
        ProjectEmail::from_project_template(&pool, &project_id, Templates::PasswordReset).await;

    if let Err(err) = settings {
        let is_admin = ProjectData::is_admin(&pool, &project_id).await?;
        if is_admin {
            return Ok(());
        } else {
            return Err(ApiError::from(err));
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

    let email = Template::create_email(
        &pool,
        &project_id,
        &device_languages,
        &user_email,
        &ctx,
        &settings,
        Templates::PasswordChanged,
    )
    .await?;

    email.send(settings.email).await?;

    Ok(())
}

#[post("/set_password", format = "json", data = "<body>")]
pub async fn handler(
    pool: Db,
    project: Project,
    token: AccessToken,
    body: Json<Payload>,
) -> Result<Status, ApiError> {
    let user_id = token.sub();
    set_password(&pool, user_id, project.id, body.into_inner()).await?;
    Ok(Status::Ok)
}
