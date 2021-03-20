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
    token: AccessToken,
) -> Result<Json<User>, ApiError> {
    let user_id = id.into_inner();

    if !token.is_user(&user_id) {
        return Err(ApiError::Forbidden);
    }

    let user = User::get_by_id(pool.inner(), &user_id, &project.id).await?;
    Ok(Json(user))
}
