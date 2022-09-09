use crate::api_key::data::{ApiKey, ApiKeys};
use crate::db::Db;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::session::data::AccessToken;

use rocket::serde::json::Json;
use uuid::Uuid;

pub async fn list_api_keys(
    pool: &Db,
    user_id: &Uuid,
    project_id: &Uuid,
) -> Result<ApiKeys, ApiError> {
    let keys = ApiKey::list(pool, user_id, project_id).await?;
    Ok(ApiKeys { keys })
}

#[get("/list")]
pub async fn handler(
    pool: Db,
    access_token: AccessToken,
    project: Project,
) -> Result<Json<ApiKeys>, ApiError> {
    let user_id = access_token.sub();
    let keys = list_api_keys(&pool, &user_id, &project.id).await?;
    Ok(Json(keys))
}
