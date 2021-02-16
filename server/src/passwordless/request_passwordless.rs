use crate::data::project::Flags;
use crate::data::token::Passwordless;
use crate::data::user::User;
use crate::data::AuthDb;
use crate::mail::Email;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::settings::data::ProjectEmail;
use crate::template::Template;

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

    let email = body.email.clone().to_lowercase();
    let user = conn
        .run(move |client| User::get_by_email(client, email, project.id))
        .await?;

    let token = Passwordless::get_token();
    let verification_token = Passwordless::hash_token(&token)?;

    let email = body.email.clone();
    let id = conn
        .run(move |client| {
            let id = user.map(|u| u.id);
            Passwordless::create_token(client, id, email, verification_token, project.id)
        })
        .await?;

    let settings = conn
        .run(move |client| ProjectEmail::from_project(client, project.id))
        .await?;

    let base_url = "http://localhost:3000".to_string();
    let link: String = format!("{}?email={}&token={}", base_url, body.email, token);

    let content = Template::passwordless(link);

    let email = Email {
        to_email: body.email.clone(),
        subject: String::from("Sign In"),
        content,
    };

    match settings {
        None => return Err(ApiError::InternalServerError),
        Some(settings) => email.send(settings).await?,
    };

    Ok(Json([id]))
}
