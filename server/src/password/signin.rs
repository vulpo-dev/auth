use crate::data::token::{AccessToken, RefreshToken};
use crate::data::user::User;
use crate::data::AuthDb;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::response::token::Token;

use bcrypt::verify;
use rocket::http::CookieJar;
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
) -> Result<Token, ApiError> {
    let email = body.email.clone();
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

    let refresh_token = match cookies.get("refresh_token") {
        None => None,
        Some(cookie) => match Uuid::parse_str(cookie.value()) {
            Err(_) => None,
            Ok(id) => {
                let row = conn.run(move |client| RefreshToken::get(client, id)).await;

                match row {
                    Err(_) => None,
                    Ok(refresh_token) => Some(refresh_token),
                }
            }
        },
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
    let ids = users.clone();
    let refresh_token = conn
        .run(move |client| RefreshToken::create(client, uses_ids, expire, project.id))
        .await?;

    let users = conn
        .run(move |client| User::get_ids(client, users, project.id))
        .await?;

    let tokens = users
        .iter()
        .map(|user| AccessToken::new(&user))
        .flat_map(|token| token.to_jwt())
        .collect::<Vec<String>>();

    Ok(Token {
        access_tokens: tokens,
        refresh_token: refresh_token.to_string(),
        created: false,
        users: ids,
    })
}
