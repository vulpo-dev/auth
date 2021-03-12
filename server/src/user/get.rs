use crate::db::AuthDb;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::user::data::User;

use rocket_contrib::json::Json;
use rocket_contrib::uuid::Uuid;

#[get("/get/<id>")]
pub async fn handler(conn: AuthDb, id: Uuid, project: Project) -> Result<Json<User>, ApiError> {
    let user = conn
        .run(move |client| User::get_by_id(client, *id, project.id))
        .await?;

    Ok(Json(user))
}
