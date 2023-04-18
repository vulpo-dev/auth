use crate::admin::data::{Admin, NewProject, PartialProject};
use crate::config::Secrets;
use crate::keys::data::ProjectKeys;

use rocket::serde::json::Json;
use rocket::State;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

#[derive(Debug, Serialize)]
pub struct Project {
    pub id: Option<Uuid>,
}

pub async fn get_admin(pool: &Db) -> Result<Project, ApiError> {
    let id = Admin::get_project(&pool).await?;
    Ok(Project { id })
}

#[get("/project/has")]
pub async fn has(pool: Db) -> Result<Json<Project>, ApiError> {
    let project = get_admin(&pool).await?;
    Ok(Json(project))
}

#[derive(Deserialize)]
pub struct CreateAdminProject {
    pub host: String,
}

pub async fn create_admin_project(
    pool: &PgPool,
    host: &str,
    passphrase: &str,
) -> Result<Uuid, ApiError> {
    let project = Admin::get_project(&pool).await?;

    if project.is_some() {
        return Err(ApiError::AdminProjectExists);
    }

    let project = NewProject {
        name: "Admin".to_string(),
        domain: host.to_string(),
    };

    let keys = ProjectKeys::create_keys(true, None, passphrase);

    // todo: transaction
    let id = Admin::create_project(&pool, &project, &keys).await?;
    Admin::set_admin(&pool, &id).await?;

    Ok(id)
}

pub async fn create_project(
    pool: &Db,
    project: NewProject,
    passphrase: &str,
) -> Result<Uuid, ApiError> {
    let keys = ProjectKeys::create_keys(true, None, passphrase);

    // todo: transaction
    let id = Admin::create_project(&pool, &project, &keys).await?;
    Ok(id)
}

#[post("/project/create", format = "json", data = "<body>")]
pub async fn create(
    pool: Db,
    body: Json<NewProject>,
    secrets: &State<Secrets>,
    _admin: Admin,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    let id = create_project(&pool, body.into_inner(), &secrets.passphrase).await?;
    Ok(Json([id]))
}

#[get("/project/list")]
pub async fn list(pool: Db, _admin: Admin) -> Result<Json<Vec<PartialProject>>, ApiError> {
    let projects = Admin::project_list(&pool).await?;
    Ok(Json(projects))
}
