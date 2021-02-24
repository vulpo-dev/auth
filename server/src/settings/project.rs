use crate::data::admin::Admin;
use crate::data::project::Project;
use crate::data::AuthDb;
use crate::response::error::ApiError;

use rocket_contrib::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct SetProjectSettings {
    pub project: Uuid,
    pub name: String,
    pub domain: String,
}

#[post("/project", data = "<body>")]
pub async fn set_settings(
    conn: AuthDb,
    body: Json<SetProjectSettings>,
    _admin: Admin,
) -> Result<(), ApiError> {
    conn.run(move |client| Project::set_settings(client, &body.project, &body.name, &body.domain))
        .await?;

    Ok(())
}
