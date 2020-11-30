use crate::data::token::Token as Jwt;
use crate::data::user::User;
use crate::db::AuthDb;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::response::token::Token;
use chrono::{Duration, Utc};
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

    let user = User::create(&conn, body.email.clone(), body.password.clone(), project.id).await?;

    let token = Jwt::access_token(&user)?;
    let expire = Utc::now() + Duration::days(90);
    let refresh_token = Jwt::refresh_token(&conn, user.id, expire, project.id).await?;

    Ok(Token {
        access_token: token,
        refresh_token: refresh_token.to_string(),
        created: true,
    })
}
