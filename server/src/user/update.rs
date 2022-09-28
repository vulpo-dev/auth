use crate::admin::data::Admin;
use crate::project::Project;
use crate::session::data::AccessToken;
use crate::user::data::{UpdateUser, User};
use crate::user::verify_email::{send_email_verification, SendEmailVerification};

use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::serde::uuid::Uuid;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

pub async fn update_user(
    pool: &Db,
    user_id: Uuid,
    body: UpdateUser,
    project_id: Uuid,
) -> Result<(), ApiError> {
    let user = User::update(&pool, &user_id, &body).await?;

    if user.email_verified == false {
        let options = SendEmailVerification {
            user_id,
            project_id,
        };

        send_email_verification(&pool, options).await?;
    }

    Ok(())
}

#[post("/update", format = "json", data = "<body>")]
pub async fn handler(
    pool: Db,
    body: Json<UpdateUser>,
    token: AccessToken,
    project: Project,
) -> Result<Status, ApiError> {
    let user_id = token.sub();
    update_user(&pool, user_id, body.into_inner(), project.id).await?;
    Ok(Status::Ok)
}

#[post(
    "/admin/update?<user_id>&<project_id>",
    format = "json",
    data = "<body>"
)]
pub async fn admin_handler(
    pool: Db,
    user_id: Uuid,
    project_id: Uuid,
    body: Json<UpdateUser>,
    _admin: Admin,
) -> Result<Status, ApiError> {
    update_user(&pool, user_id, body.into_inner(), project_id).await?;
    Ok(Status::Ok)
}
