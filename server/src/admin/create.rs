use crate::data::admin::{Admin, NewAdmin};
use crate::data::AuthDb;
use crate::project::Project;
use crate::response::error::ApiError;

use rocket;
use rocket_contrib::json::Json;
use uuid::Uuid;

#[post("/__/create", data = "<body>")]
pub async fn handler(
    conn: AuthDb,
    body: Json<NewAdmin>,
    project: Project,
    _admin: Admin,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    let id = conn
        .run(move |client| Admin::create(client, body.into_inner(), project.id))
        .await?;

    Ok(Json([id]))
}

#[post("/__/create_once", data = "<body>")]
pub async fn create_once(
    conn: AuthDb,
    body: Json<NewAdmin>,
    project: Project,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    let has_admin = conn.run(|client| Admin::has_admin(client)).await?;
    if has_admin {
        return Err(ApiError::AdminHasAdmin);
    }

    let id = conn
        .run(move |client| Admin::create(client, body.into_inner(), project.id))
        .await?;
    Ok(Json([id]))
}
