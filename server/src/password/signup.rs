use crate::config::Secrets;
use crate::db::Db;
use crate::keys::data::ProjectKeys;
use crate::mail::data::VerifyEmail;
use crate::mail::Email;
use crate::password::validate_password_length;
use crate::project::data::Flags;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::response::SessionResponse;
use crate::session::data::{AccessToken, Session, Token};
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
    let user = User::create(pool.inner(), &email, &body.password, project.id).await?;

    let private_key =
        ProjectKeys::get_private_key(pool.inner(), &project.id, &secrets.secrets_passphrase)
            .await?;

    let exp = Utc::now() + Duration::minutes(15);
    let access_token = AccessToken::new(&user, exp, &project.id)
        .to_jwt_rsa(&private_key)
        .map_err(|_| ApiError::InternalServerError)?;

    let session = Session {
        id: body.session,
        public_key: body.public_key.to_owned(),
        user_id: Some(user.id),
        expire_at: Utc::now() + Duration::days(30),
    };

    let session = Session::create(pool.inner(), session).await?;

    let verify = Flags::has_flags(pool.inner(), &project.id, &[Flags::VerifyEmail]).await;

    if verify.is_ok() {
        let settings =
            ProjectEmail::from_project_template(pool.inner(), &project.id, Templates::VerifyEmail)
                .await?;

        let reset_token = Token::create();
        let hashed_token = Token::hash(&reset_token)?;

        let user_id = user.clone().id;
        let token_id =
            VerifyEmail::insert(pool.inner(), &user_id, hashed_token, &project.id).await?;

        let link: String = format!(
            "{}{}?id={}&token={}",
            settings.domain, settings.redirect_to, token_id, reset_token
        );

        let ctx = TemplateCtx {
            href: link,
            project: settings.name,
            user: None,
        };

        let content = Template::render(settings.body, ctx).map_err(|_| ApiError::TemplateRender)?;

        let email = Email {
            to_email: email,
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
