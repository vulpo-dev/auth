use crate::admin::data::{Admin, NewProject, PartialProject};
use crate::config::Secrets;
use crate::keys::data::ProjectKeys;
use crate::response::error::ApiError;
use crate::template::Template;

use rocket::serde::json::Json;
use rocket::State;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use werkbank::rocket::Db;

#[derive(Debug, Serialize)]
pub struct Project {
    pub id: Option<Uuid>,
}

pub async fn get_admin(pool: &Db) -> Result<Project, ApiError> {
    let id = Admin::get_project(&pool).await?;
    Ok(Project { id })
}

#[get("/__/project/has")]
pub async fn has(pool: Db) -> Result<Json<Project>, ApiError> {
    let project = get_admin(&pool).await?;
    Ok(Json(project))
}

#[derive(Deserialize)]
pub struct CreateAdminProject {
    pub host: String,
}

pub async fn create_admin_project(
    pool: &Db,
    data: CreateAdminProject,
    passphrase: &str,
) -> Result<Project, ApiError> {
    let project = Admin::get_project(&pool).await?;

    if project.is_some() {
        return Err(ApiError::AdminProjectExists);
    }

    let project = NewProject {
        name: "Admin".to_string(),
        domain: data.host.to_owned(),
    };

    let keys = ProjectKeys::create_keys(true, None, passphrase);

    // todo: transaction
    let id = Admin::create_project(&pool, &project, &keys).await?;
    Admin::set_admin(&pool, &id).await?;
    Template::insert_defaults(&pool, &id).await?;

    Ok(Project { id: Some(id) })
}

#[post("/__/project/create_admin", format = "json", data = "<body>")]
pub async fn create_admin(
    pool: Db,
    secrets: &State<Secrets>,
    body: Json<CreateAdminProject>,
) -> Result<Json<Project>, ApiError> {
    let project = create_admin_project(&pool, body.into_inner(), &secrets.passphrase).await?;
    Ok(Json(project))
}

pub async fn create_project(
    pool: &Db,
    project: NewProject,
    passphrase: &str,
) -> Result<Uuid, ApiError> {
    let keys = ProjectKeys::create_keys(true, None, passphrase);

    // todo: transaction
    let id = Admin::create_project(&pool, &project, &keys).await?;
    Template::insert_defaults(&pool, &id).await?;
    Ok(id)
}

#[post("/__/project/create", format = "json", data = "<body>")]
pub async fn create(
    pool: Db,
    body: Json<NewProject>,
    secrets: &State<Secrets>,
    _admin: Admin,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    let id = create_project(&pool, body.into_inner(), &secrets.passphrase).await?;
    Ok(Json([id]))
}

#[get("/__/project/list")]
pub async fn list(pool: Db, _admin: Admin) -> Result<Json<Vec<PartialProject>>, ApiError> {
    let projects = Admin::project_list(&pool).await?;
    Ok(Json(projects))
}
