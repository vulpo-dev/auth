use crate::data::token::{RefreshToken, Token as Jwt};
use crate::data::user::User;
use crate::db::AuthDb;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::response::token::Token;

use bcrypt::verify;
use rocket_contrib::json::Json;
use serde::Deserialize;

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
) -> Result<Token, ApiError> {
    let user = User::password(&conn, body.email.clone(), project.id).await?;

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

    let token = Jwt::access_token(&user)?;
    let expire = RefreshToken::expire();
    let refresh_token = conn
        .run(move |client| RefreshToken::create(client, user.id, expire, project.id))
        .await?;

    Ok(Token {
        access_token: token,
        refresh_token: refresh_token.to_string(),
        created: false,
    })
}
