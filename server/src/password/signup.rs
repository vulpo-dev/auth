use crate::data::keys::ProjectKeys;
use crate::data::project::Flags;
use crate::data::token::{AccessToken, RefreshToken};
use crate::data::user::User;
use crate::data::AuthDb;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::response::token::Token;
use rocket::http::CookieJar;
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
) -> Result<Token, ApiError> {
    conn.run(move |client| {
        Flags::has_flags(
            client,
            &project.id,
            &[Flags::SignUp, Flags::EmailAndPassword],
        )
    })
    .await?;

    if body.password.len() < 8 {
        return Err(ApiError::AuthPasswordLength);
    }

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
        .run(move |client| User::get_ids(client, users, &project.id))
        .await?;

    let private_key = conn
        .run(move |client| ProjectKeys::get_private_key(client, &project.id))
        .await?;

    let tokens = users
        .iter()
        .map(|user| AccessToken::new(&user))
        .flat_map(|token| token.to_jwt_rsa(&private_key))
        .collect::<Vec<String>>();

    Ok(Token {
        access_tokens: tokens,
        refresh_token: refresh_token.to_string(),
        created: true,
        users: ids,
    })
}
