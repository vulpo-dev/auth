use crate::config::secrets::Secrets;
use crate::data::keys::ProjectKeys;
use crate::data::token::Token;
use crate::data::user::User;
use crate::data::AuthDb;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::token::AccessToken;

use crate::data::session::{RefreshAccessToken, Session};
use crate::response::SessionResponse;

use chrono::{Duration, Utc};
use rocket::State;
use rocket_contrib::json::Json;
use rocket_contrib::uuid::Uuid;

#[post("/refresh/<session_id>", data = "<rat>")]
pub async fn handler(
    conn: AuthDb,
    project: Project,
    session_id: Uuid,
    rat: Json<RefreshAccessToken>,
    secrets: State<'_, Secrets>,
) -> Result<SessionResponse, ApiError> {
    let session = session_id.into_inner().clone();
    let session = conn
        .run(move |client| Session::get(client, &session))
        .await?;

    let claims = Session::validate_token(&session, &rat)?;

    let is_valid = conn
        .run(move |client| Token::is_valid(client, &claims, &session_id.into_inner()))
        .await?;

    if !is_valid {
        return Err(ApiError::Forbidden);
    }

    let session_id = session.id;
    let expire_at = Utc::now() + Duration::days(30);
    conn.run(move |client| Session::extend(client, &session_id, &expire_at))
        .await?;

    let passphrase = secrets.secrets_passphrase.clone();
    let private_key = conn
        .run(move |client| ProjectKeys::get_private_key(client, &project.id, &passphrase))
        .await?;

    let user_id = match session.user_id {
        None => return Err(ApiError::Forbidden),
        Some(id) => id,
    };

    let uid = user_id.clone();
    let user = conn
        .run(move |client| User::get_by_id(client, uid, project.id))
        .await?;

    let exp = Utc::now() + Duration::minutes(15);
    let access_token = AccessToken::new(&user, exp);
    let access_token = match access_token.to_jwt_rsa(&private_key) {
        Ok(at) => at,
        Err(_) => return Err(ApiError::InternalServerError),
    };

    Ok(SessionResponse {
        access_token,
        user_id,
        created: false,
        session: session.id,
        expire_at: session.expire_at,
    })
}
