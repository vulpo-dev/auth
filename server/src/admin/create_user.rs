use crate::admin::data::{Admin, NewUser};
use crate::db::Db;
use crate::password;
use crate::password::data::Password;
use crate::project::data::Project as ProjectData;
use crate::response::error::ApiError;

use rocket;
use rocket::serde::json::Json;
use uuid::Uuid;

pub async fn create_user(pool: &Db, user: NewUser) -> Result<Uuid, ApiError> {
    if user.provider_id == "password" {
        if let Some(password) = &user.password {
            password::validate_password_length(&password)?
        } else {
            return Err(ApiError::PasswordMinLength);
        }
    }

    let user_id = Admin::create_user(&pool, &user).await?;

    if let Some(password) = &user.password {
        let alg = ProjectData::password_alg(&pool, &user.project_id).await?;
        Password::create_password(&pool, &user_id, &password, &alg, &user.project_id).await?;
    }

    Ok(user_id)
}

#[post("/__/create_user", format = "json", data = "<body>")]
pub async fn handler(
    pool: Db,
    body: Json<NewUser>,
    _admin: Admin,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    let user_id = create_user(&pool, body.into_inner()).await?;
    Ok(Json([user_id]))
}
