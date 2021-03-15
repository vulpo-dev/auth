use crate::admin::data::{Admin, NewProject, PartialProject};
use crate::config::Secrets;
use crate::db::Db;
use crate::response::error::ApiError;
use crate::session::data::ProjectKeys;

use rocket::Config;
use rocket::State;
use rocket_contrib::json::Json;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct Project {
    pub id: Option<Uuid>,
}

#[get("/__/project/has")]
pub async fn has(pool: Db<'_>) -> Result<Json<Project>, ApiError> {
    let id = Admin::get_project(pool.inner()).await?;
    Ok(Json(Project { id }))
}

#[post("/__/project/create_admin")]
pub async fn create_admin(
    pool: Db<'_>,
    secrets: State<'_, Secrets>,
    config: State<'_, Config>,
) -> Result<Json<Project>, ApiError> {
    let project = Admin::get_project(pool.inner()).await?;

    if project.is_some() {
        return Err(ApiError::AdminProjectExists);
    }

    let domain = format!("http://127.0.0.1:{}", config.port);

    let project = NewProject {
        name: "Admin".to_string(),
        domain,
    };

    let keys = ProjectKeys::create_keys(true, None, &secrets.secrets_passphrase);
    let id = Admin::create_project(pool.inner(), &project, &keys).await?;
    Admin::set_admin(pool.inner(), &id).await?;

    Ok(Json(Project { id: Some(id) }))
}

#[post("/__/project/create", data = "<body>")]
pub async fn create(
    pool: Db<'_>,
    body: Json<NewProject>,
    secrets: State<'_, Secrets>,
    _admin: Admin,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    let keys = ProjectKeys::create_keys(true, None, &secrets.secrets_passphrase);
    let id = Admin::create_project(pool.inner(), &body.into_inner(), &keys).await?;
    Ok(Json([id]))
}

#[get("/__/project/list")]
pub async fn list(pool: Db<'_>, _admin: Admin) -> Result<Json<Vec<PartialProject>>, ApiError> {
    let projects = Admin::project_list(pool.inner()).await?;
    Ok(Json(projects))
}
