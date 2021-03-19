use crate::db::Db;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::session::data::AccessToken;
use crate::user::data::User;

use rocket_contrib::json::Json;
use rocket_contrib::uuid::Uuid;

#[get("/get/<id>")]
pub async fn handler(
    pool: Db<'_>,
    id: Uuid,
    project: Project,
    _token: AccessToken,
) -> Result<Json<User>, ApiError> {
    let user = User::get_by_id(pool.inner(), &id.into_inner(), &project.id).await?;
    Ok(Json(user))
}
