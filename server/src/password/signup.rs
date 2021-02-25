use crate::config::secrets::Secrets;
use crate::data::keys::ProjectKeys;
use crate::data::project::Flags;
use crate::data::token::{AccessToken, RefreshToken};
use crate::data::user::User;
use crate::data::AuthDb;
use crate::mail::Email;
use crate::password::validate_password_length;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::response::token::Token;
use crate::settings::data::ProjectEmail;
use crate::template::{Template, TemplateCtx, Templates};

use rocket::http::CookieJar;
use rocket::State;
use rocket_contrib::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct SignUp {
    pub email: String,
    pub password: String,
}

#[post("/sign_up", data = "<body>")]
pub async fn sign_up(
    conn: AuthDb,
    body: Json<SignUp>,
    project: Project,
    cookies: &CookieJar<'_>,
    secrets: State<'_, Secrets>,
) -> Result<Token, ApiError> {
    conn.run(move |client| {
        Flags::has_flags(
            client,
            &project.id,
            &[Flags::SignUp, Flags::EmailAndPassword],
        )
    })
    .await?;

    validate_password_length(&body.password)?;

    let refresh_token_id = cookies
        .get("refresh_token")
        .and_then(|cookie| Uuid::parse_str(cookie.value()).ok());

    let refresh_token = match refresh_token_id {
        None => None,
        Some(id) => conn
            .run(move |client| RefreshToken::get(client, id))
            .await
            .ok(),
    };

    let email = body.email.trim().to_lowercase();
    let password = body.password.clone();
    let user = conn
        .run(move |client| User::create(client, email, password, project.id))
        .await?;

    let expire = RefreshToken::expire();
    let users = if let Some(token) = refresh_token {
        token
            .users
            .iter()
            .filter(|id| id != &&user.id)
            .chain(&vec![user.id])
            .map(|&x| x)
            .collect::<Vec<Uuid>>()
    } else {
        vec![user.id]
    };

    let uses_ids = users.clone();
    let refresh_token = conn
        .run(move |client| RefreshToken::create(client, uses_ids, expire, project.id))
        .await?;

    let passphrase = secrets.secrets_passphrase.clone();
    let private_key = conn
        .run(move |client| ProjectKeys::get_private_key(client, &project.id, &passphrase))
        .await?;

    let access_token = AccessToken::new(&user);
    let access_token = match access_token.to_jwt_rsa(&private_key) {
        Ok(at) => at,
        Err(_) => return Err(ApiError::InternalServerError),
    };

    let verify = conn
        .run(move |client| Flags::has_flags(client, &project.id, &[Flags::VerifyEmail]))
        .await;

    if verify.is_ok() {
        let settings = conn
            .run(move |client| {
                ProjectEmail::from_project_template(client, project.id, Templates::Passwordless)
            })
            .await?;

        let link: String = format!(
            "{}{}?email={}",
            settings.domain, settings.redirect_to, body.email
        );

        let ctx = TemplateCtx {
            href: link,
            project: settings.name,
            user: None,
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
    }

    Ok(Token {
        access_token,
        refresh_token: refresh_token.to_string(),
        created: true,
        user_id: user.id,
    })
}
