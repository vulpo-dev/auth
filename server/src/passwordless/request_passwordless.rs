use crate::data::project::Flags;
use crate::data::token::Passwordless;
use crate::data::user::User;
use crate::data::AuthDb;
use crate::mail::Email;
use crate::project::Project;
use crate::response::error::ApiError;
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

    let email = body.email.clone();
    let user = conn
        .run(move |client| User::get_by_email(client, email, project.id))
        .await?;

    let token = Passwordless::get_token();
    let verification_token = Passwordless::hash_token(&token)?;

    let email = body.email.clone();
    let id = conn
        .run(move |client| {
            Passwordless::create_token(client, user.id, email, verification_token, project.id)
        })
        .await?;

    let base_url = "http://localhost:3000".to_string();
    let link: String = format!("{}?email={}&token={}", base_url, body.email, token);

    let content = Template::passwordless(link);

    match Email::send(content).await {
        Ok(_) => Ok(Json([id])),
        Err(_e) => Err(ApiError::InternalServerError),
    }
}
