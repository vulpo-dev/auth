use crate::data::user::User;
use crate::data::AuthDb;
use crate::project::Project;
use crate::response::error::ApiError;

use rocket::Route;
use rocket_contrib::json::Json;
use rocket_contrib::uuid::Uuid;

#[get("/<id>")]
async fn get_user(conn: AuthDb, id: Uuid, project: Project) -> Result<Json<User>, ApiError> {
    let user = conn
        .run(move |client| User::get_by_id(client, *id, project.id))
        .await?;

    Ok(Json(user))
}

pub fn routes() -> Vec<Route> {
    routes![get_user]
}
