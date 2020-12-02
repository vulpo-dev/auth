use crate::data::token::{AccessToken, RefreshToken};
use crate::data::user::User;
use crate::data::AuthDb;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::response::token::Token;
use rocket_contrib::json::Json;
use serde::Deserialize;

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
) -> Result<Token, ApiError> {
    if body.password.len() < 8 {
        return Err(ApiError::AuthPasswordLength);
    }

    let user = conn
        .run(move |client| {
            User::create(
                client,
                body.email.clone(),
                body.password.clone(),
                project.id,
            )
        })
        .await?;

    let token = AccessToken::new(&user);
    let expire = RefreshToken::expire();
    let refresh_token = conn
        .run(move |client| RefreshToken::create(client, user.id, expire, project.id))
        .await?;

    Ok(Token {
        access_token: token.to_jwt()?,
        refresh_token: refresh_token.to_string(),
        created: true,
    })
}
