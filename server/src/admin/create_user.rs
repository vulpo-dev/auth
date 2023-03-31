use crate::admin::data::{Admin, NewUser};
use crate::password;
use crate::password::data::Password;
use crate::project::data::Project as ProjectData;
use crate::user::data::User;

use rocket;
use rocket::serde::json::Json;
use uuid::Uuid;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

pub async fn create_user(pool: &Db, user: &NewUser) -> Result<Uuid, ApiError> {
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

#[post("/create_user", format = "json", data = "<body>")]
pub async fn handler(pool: Db, body: Json<NewUser>, _admin: Admin) -> Result<Json<User>, ApiError> {
    let user_id = create_user(&pool, &body).await?;
    let user = User::get_by_id(&pool, &user_id, &body.project_id)
        .await?
        .ok_or(ApiError::NotFound)?;

    Ok(Json(user))
}
