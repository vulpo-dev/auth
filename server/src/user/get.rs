use crate::admin::data::Admin;
use crate::db::Db;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::session::data::AccessToken;
use crate::user::data::User;

use rocket::serde::json::Json;
use rocket::serde::uuid::Uuid;

#[get("/get")]
pub async fn handler(
    pool: Db,
    project: Project,
    token: AccessToken,
) -> Result<Json<User>, ApiError> {
    let user_id = token.sub();
    User::get_by_id(&pool, &user_id, &project.id)
        .await
        .map(Json)
}

#[get("/get_by_id?<user>&<project>")]
pub async fn admin_handler(
    pool: Db,
    user: Uuid,
    project: Uuid,
    _admin: Admin,
) -> Result<Json<User>, ApiError> {
    User::get_by_id(&pool, &user, &project).await.map(Json)
}
