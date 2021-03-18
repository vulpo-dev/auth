use crate::config::Secrets;
use crate::db::{AuthDb, Db};
use crate::mail::data::VerifyEmail;
use crate::mail::Email;
use crate::password::validate_password_length;
use crate::project::data::Flags;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::response::SessionResponse;
use crate::session::data::ProjectKeys;
use crate::session::data::Session;
use crate::session::data::{AccessToken, Token};
use crate::settings::data::ProjectEmail;
use crate::template::{Template, TemplateCtx, Templates};
use crate::user::data::User;

use chrono::{Duration, Utc};
use rocket::State;
use rocket_contrib::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct SignUp {
    pub email: String,
    pub password: String,
    pub session: Uuid,
    pub public_key: Vec<u8>,
}

#[post("/sign_up", data = "<body>")]
pub async fn sign_up(
    conn: AuthDb,
    pool: Db<'_>,
    body: Json<SignUp>,
    project: Project,
    secrets: State<'_, Secrets>,
) -> Result<SessionResponse, ApiError> {
    Flags::has_flags(
        pool.inner(),
        &project.id,
        &[Flags::SignUp, Flags::EmailAndPassword],
    )
    .await?;

    validate_password_length(&body.password)?;

    let email = body.email.trim().to_lowercase();
    let password = body.password.clone();
    let user = conn
        .run(move |client| User::create(client, email, password, project.id))
        .await?;

    let passphrase = secrets.secrets_passphrase.clone();
    let private_key = conn
        .run(move |client| ProjectKeys::get_private_key(client, &project.id, &passphrase))
        .await?;

    let exp = Utc::now() + Duration::minutes(15);
    let access_token = AccessToken::new(&user, exp);
    let access_token = match access_token.to_jwt_rsa(&private_key) {
        Ok(at) => at,
        Err(_) => return Err(ApiError::InternalServerError),
    };

    let user_id = user.id;
    let session_id = body.session.clone();
    let public_key = body.public_key.clone();
    let session = conn
        .run(move |client| {
            let session = Session {
                id: session_id,
                public_key,
                user_id: Some(user_id),
                expire_at: Utc::now() + Duration::days(30),
            };

            Session::create(client, session)
        })
        .await?;

    let verify = Flags::has_flags(pool.inner(), &project.id, &[Flags::VerifyEmail]).await;

    if verify.is_ok() {
        let settings = conn
            .run(move |client| {
                ProjectEmail::from_project_template(client, project.id, Templates::VerifyEmail)
            })
            .await?;

        let reset_token = Token::create();
        let hashed_token = Token::hash(&reset_token)?;

        let user_id = user.clone().id;
        let token_id = VerifyEmail::insert(pool.inner(), &user_id, hashed_token).await?;

        let link: String = format!(
            "{}{}?id={}&token={}",
            settings.domain, settings.redirect_to, token_id, reset_token
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

    Ok(SessionResponse {
        access_token,
        created: true,
        user_id: session.user_id.unwrap(),
        session: session.id,
        expire_at: session.expire_at,
    })
}
