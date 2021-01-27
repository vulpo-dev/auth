use crate::data::admin::Admin;
use crate::data::AuthDb;
use crate::response::error::ApiError;
use crate::settings::data::{ProjectEmail, Settings};

use rocket_contrib::json::Json;
use rocket_contrib::uuid::Uuid;

#[get("/email?<project>")]
pub async fn get_handler(
    conn: AuthDb,
    project: Uuid,
    _admin: Admin,
) -> Result<Json<Settings>, ApiError> {
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
    body: Json<Settings>,
) -> Result<(), ApiError> {
    let settings = body.into_inner();
    let project_id = project.into_inner();

    conn.run(move |client| ProjectEmail::insert(client, project_id, settings))
        .await?;

    Ok(())
}
