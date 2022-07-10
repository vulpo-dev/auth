use crate::admin::data::Admin;
use crate::db::Db;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::session::data::AccessToken;
use crate::user::data::User;

use rocket::serde::json::Json;
use rocket::serde::uuid::Uuid;

pub async fn get_user(pool: &Db, user_id: Uuid, project_id: Uuid) -> Result<User, ApiError> {
    User::get_by_id(&pool, &user_id, &project_id)
        .await?
        .ok_or(ApiError::NotFound)
}

#[get("/get")]
pub async fn handler(
    pool: Db,
    project: Project,
    token: AccessToken,
) -> Result<Json<User>, ApiError> {
    let user_id = token.sub();
    let user = get_user(&pool, user_id, project.id).await?;
    Ok(Json(user))
}

#[get("/get_by_id?<user>&<project>")]
pub async fn admin_handler(
    pool: Db,
    user: Uuid,
    project: Uuid,
    _admin: Admin,
) -> Result<Json<User>, ApiError> {
    let user = get_user(&pool, user, project).await?;
    Ok(Json(user))
}
