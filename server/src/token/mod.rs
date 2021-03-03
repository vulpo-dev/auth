use crate::config::secrets::Secrets;
use crate::data::keys::ProjectKeys;
use crate::data::token::AccessToken;
use crate::data::user::User;
use crate::data::AuthDb;
use crate::project::Project;
use crate::response::error::ApiError;

use crate::response::SessionResponse;
use crate::session::{RefreshAccessToken, Session};

use chrono::{Duration, Utc};
use rocket::Route;
use rocket::State;
use rocket_contrib::json::Json;
use rocket_contrib::uuid::Uuid;

#[post("/refresh/<session_id>", data = "<rat>")]
pub async fn refresh(
    conn: AuthDb,
    project: Project,
    session_id: Uuid,
    rat: Json<RefreshAccessToken>,
    secrets: State<'_, Secrets>,
) -> Result<SessionResponse, ApiError> {
    let session = conn
        .run(move |client| Session::get(client, &session_id.into_inner()))
        .await?;

    let is_valid = Session::validate_token(&session, &rat)?;

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

    let user_id = session.user_id;
    let user = conn
        .run(move |client| User::get_by_id(client, user_id, project.id))
        .await?;

    let access_token = AccessToken::new(&user);
    let access_token = match access_token.to_jwt_rsa(&private_key) {
        Ok(at) => at,
        Err(_) => return Err(ApiError::InternalServerError),
    };

    Ok(SessionResponse {
        access_token,
        created: false,
        user_id: session.user_id,
        session: session.id,
        expire_at: session.expire_at,
    })
}

pub fn routes() -> Vec<Route> {
    routes![refresh]
}
