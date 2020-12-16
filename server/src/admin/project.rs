use crate::data::admin::{Admin, NewProject, PartialProject};
use crate::data::keys::ProjectKeys;
use crate::data::AuthDb;
use crate::response::error::ApiError;

use rocket_contrib::json::Json;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct Project {
    pub id: Option<Uuid>,
}

#[get("/__/project/has")]
pub async fn has(conn: AuthDb) -> Result<Json<Project>, ApiError> {
    let id = conn.run(|client| Admin::get_project(client)).await?;
    Ok(Json(Project { id }))
}

#[post("/__/project/create_admin")]
pub async fn create_admin(conn: AuthDb) -> Result<Json<Project>, ApiError> {
    let project = conn.run(|client| Admin::get_project(client)).await?;

    if let Some(_) = project {
        return Err(ApiError::AdminProjectExists);
    }

    let project = NewProject {
        name: "Admin".to_string(),
    };

    let id = conn
        .run(|client| {
            let mut trx = match client.transaction() {
                Ok(trx) => trx,
                Err(_) => return Err(ApiError::InternalServerError),
            };

            let id = Admin::create_admin_project(&mut trx, project)?;
            let keys = ProjectKeys::create_keys(id, true, None);
            ProjectKeys::insert(&mut trx, &keys)?;

            if let Err(_) = trx.commit() {
                return Err(ApiError::InternalServerError);
            }

            Ok(id)
        })
        .await?;

    Ok(Json(Project { id: Some(id) }))
}

#[post("/__/project/create", data = "<body>")]
pub async fn create(
    conn: AuthDb,
    body: Json<NewProject>,
    _admin: Admin,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    let id = conn
        .run(|client| {
            let mut trx = match client.transaction() {
                Ok(trx) => trx,
                Err(_) => return Err(ApiError::InternalServerError),
            };

            let id = Admin::create_project(&mut trx, body.into_inner())?;
            let keys = ProjectKeys::create_keys(id, true, None);
            ProjectKeys::insert(&mut trx, &keys)?;

            if let Err(_) = trx.commit() {
                return Err(ApiError::InternalServerError);
            }

            Ok(id)
        })
        .await?;

    Ok(Json([id]))
}

#[get("/__/project/list")]
pub async fn list(conn: AuthDb, _admin: Admin) -> Result<Json<Vec<PartialProject>>, ApiError> {
    let projects = conn.run(|client| Admin::project_list(client)).await?;
    Ok(Json(projects))
}
