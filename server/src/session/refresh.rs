use crate::config::Secrets;
use crate::db::{AuthDb, Db};
use crate::project::Project;
use crate::response::error::ApiError;
use crate::session::data::AccessToken;
use crate::session::data::ProjectKeys;
use crate::session::data::Token;
use crate::user::data::User;

use crate::response::SessionResponse;
use crate::session::data::{RefreshAccessToken, Session};

use chrono::{Duration, Utc};
use rocket::State;
use rocket_contrib::json::Json;
use rocket_contrib::uuid::Uuid;

#[post("/refresh/<session_id>", data = "<rat>")]
pub async fn handler(
    conn: AuthDb,
    pool: Db<'_>,
    project: Project,
    session_id: Uuid,
    rat: Json<RefreshAccessToken>,
    secrets: State<'_, Secrets>,
) -> Result<SessionResponse, ApiError> {
    let session = Session::get(pool.inner(), &session_id.into_inner()).await?;
    let claims = Session::validate_token(&session, &rat)?;

    let is_valid = Token::is_valid(pool.inner(), &claims, &session_id.into_inner()).await?;

    if !is_valid {
        return Err(ApiError::Forbidden);
    }

    let expire_at = Utc::now() + Duration::days(30);
    Session::extend(pool.inner(), &session.id, &expire_at).await?;

    let private_key =
        ProjectKeys::get_private_key(pool.inner(), &project.id, &secrets.secrets_passphrase)
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
