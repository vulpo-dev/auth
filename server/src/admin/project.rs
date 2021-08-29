use crate::admin::data::{Admin, NewProject, PartialProject};
use crate::config::Secrets;
use crate::db::Db;
use crate::keys::data::ProjectKeys;
use crate::response::error::ApiError;

use rocket::serde::json::Json;
use rocket::State;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct Project {
    pub id: Option<Uuid>,
}

#[get("/__/project/has")]
pub async fn has(pool: Db) -> Result<Json<Project>, ApiError> {
    Admin::get_project(&pool)
        .await
        .map(|id| Project { id })
        .map(Json)
}

#[post("/__/project/create_admin")]
pub async fn create_admin(pool: Db, secrets: &State<Secrets>) -> Result<Json<Project>, ApiError> {
    let project = Admin::get_project(&pool).await?;

    if project.is_some() {
        return Err(ApiError::AdminProjectExists);
    }

    let domain = format!("http://127.0.0.1:{}", 8000);

    let project = NewProject {
        name: "Admin".to_string(),
        domain,
    };

    let keys = ProjectKeys::create_keys(true, None, &secrets.passphrase);
    let id = Admin::create_project(&pool, &project, &keys).await?;
    Admin::set_admin(&pool, &id).await?;

    Ok(Json(Project { id: Some(id) }))
}

#[post("/__/project/create", format = "json", data = "<body>")]
pub async fn create(
    pool: Db,
    body: Json<NewProject>,
    secrets: &State<Secrets>,
    _admin: Admin,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    let keys = ProjectKeys::create_keys(true, None, &secrets.passphrase);
    Admin::create_project(&pool, &body.into_inner(), &keys)
        .await
        .map(|id| [id])
        .map(Json)
}

#[get("/__/project/list")]
pub async fn list(pool: Db, _admin: Admin) -> Result<Json<Vec<PartialProject>>, ApiError> {
    Admin::project_list(&pool).await.map(Json)
}
