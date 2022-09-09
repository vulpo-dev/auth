use crate::api_key::data::ApiKey;
use crate::db::Db;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::session::data::AccessToken;

use rocket::http::Status;
use rocket::serde::json::Json;
use serde::Deserialize;
use uuid::Uuid;

pub async fn delete_api_key(
    pool: &Db,
    id: &Uuid,
    user_id: &Uuid,
    project_id: &Uuid,
) -> Result<(), ApiError> {
    ApiKey::delete(pool, id, user_id, project_id).await?;
    Ok(())
}

#[derive(Deserialize)]
pub struct Payload {
    pub id: Uuid,
}

#[post("/delete", format = "json", data = "<body>")]
pub async fn handler(
    pool: Db,
    access_token: AccessToken,
    project: Project,
    body: Json<Payload>,
) -> Result<Status, ApiError> {
    let user_id = access_token.sub();
    delete_api_key(&pool, &body.id, &user_id, &project.id).await?;
    Ok(Status::Ok)
}
