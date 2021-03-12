use crate::admin::data::Admin;
use crate::db::AuthDb;
use crate::response::error::ApiError;
use crate::settings::data::{EmailSettings, ProjectEmail};

use rocket_contrib::json::Json;
use rocket_contrib::uuid::Uuid;

#[get("/email?<project>")]
pub async fn get_handler(
    conn: AuthDb,
    project: Uuid,
    _admin: Admin,
) -> Result<Json<Option<EmailSettings>>, ApiError> {
    let project_id = project.into_inner();
    let settings = conn
        .run(move |client| ProjectEmail::from_project(client, project_id))
        .await?;

    Ok(Json(settings))
}

#[post("/email?<project>", data = "<body>")]
pub async fn create_handler(
    conn: AuthDb,
    project: Uuid,
    body: Json<EmailSettings>,
) -> Result<(), ApiError> {
    let settings = body.into_inner();
    let project_id = project.into_inner();

    conn.run(move |client| ProjectEmail::insert(client, project_id, settings))
        .await?;

    Ok(())
}
