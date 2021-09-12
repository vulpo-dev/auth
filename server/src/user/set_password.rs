use crate::db::Db;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::session::data::AccessToken;
use crate::user::data::User;
use crate::password;

use rocket::serde::json::Json;
use rocket::http::Status;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct Payload {
    pub password: String,
}

#[post("/set_password", format="json", data="<body>")]
pub async fn set_password(
    pool: Db,
    project: Project,
    token: AccessToken,
    body: Json<Payload>
) -> Result<Status, ApiError> {
    let user_id = token.sub();
    let user = User::get_by_id(&pool, &user_id, &project.id).await?;

    if user.state != "SetPassword" {
        return Err(ApiError::Forbidden);
    }

    password::validate_password_length(&body.password)?;

    User::set_password(&pool, &user_id, &body.password).await?;

    Ok(Status::Ok)
}
