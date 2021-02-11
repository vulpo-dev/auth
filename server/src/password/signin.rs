use crate::config::secrets::Secrets;
use crate::data::project::Flags;
use crate::data::user::User;
use crate::data::AuthDb;
use crate::data::{
    keys::ProjectKeys,
    token::{AccessToken, RefreshToken},
};
use crate::project::Project;
use crate::response::error::ApiError;
use crate::response::token::Token;

use bcrypt::verify;
use rocket::http::CookieJar;
use rocket::State;
use rocket_contrib::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct SignIn {
    pub email: String,
    pub password: String,
}

#[post("/sign_in", data = "<body>")]
pub async fn sign_in(
    conn: AuthDb,
    body: Json<SignIn>,
    project: Project,
    cookies: &CookieJar<'_>,
    secrets: State<'_, Secrets>,
) -> Result<Token, ApiError> {
    conn.run(move |client| {
        Flags::has_flags(
            client,
            &project.id,
            &[Flags::SignIn, Flags::EmailAndPassword],
        )
    })
    .await?;

    let email = body.email.clone().to_lowercase();
    let user = conn
        .run(move |client| User::password(client, email, project.id))
        .await?;

    let password = match user.password {
        Some(ref password) => password,
        None => return Err(ApiError::UserInvalidPassword),
    };

    let password_valid = match verify(body.password.clone(), &password) {
        Err(_) => false,
        Ok(value) => value,
    };

    if !password_valid {
        return Err(ApiError::UserInvalidPassword);
    };

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

    let phassphrase = secrets.secrets_passphrase.clone();
    let private_key = conn
        .run(move |client| ProjectKeys::get_private_key(client, &project.id, &phassphrase))
        .await?;

    let access_token = AccessToken::new(&user);
    let access_token = match access_token.to_jwt_rsa(&private_key) {
        Ok(at) => at,
        Err(_) => return Err(ApiError::InternalServerError),
    };

    Ok(Token {
        access_token,
        refresh_token: refresh_token.to_string(),
        created: false,
        user_id: user.id,
    })
}
