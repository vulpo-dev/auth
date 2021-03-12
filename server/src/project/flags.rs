use crate::db::AuthDb;
use crate::project::data::Flags;
use crate::response::error::ApiError;
use rocket_contrib::uuid::Uuid;

use rocket_contrib::json::Json;
use serde::Serialize;

#[get("/flags?<project>")]
pub async fn handler(conn: AuthDb, project: Uuid) -> Result<Json<Response>, ApiError> {
    let flags = conn
        .run(move |client| Flags::from_project(client, &project))
        .await?;

    let result = Response { items: flags };

    Ok(Json(result))
}

#[derive(Serialize)]
pub struct Response {
    pub items: Vec<Flags>,
}
