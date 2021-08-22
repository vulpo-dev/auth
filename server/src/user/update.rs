use crate::admin::data::Admin;
use crate::db::Db;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::session::data::AccessToken;
use crate::user::data::{UpdateUser, User};
use crate::user::verify_email::{send_email_verification, SendEmailVerification};

use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::serde::uuid::Uuid;

#[post("/update", format = "json", data = "<body>")]
pub async fn handler(
    pool: Db<'_>,
    body: Json<UpdateUser>,
    token: AccessToken,
    project: Project,
) -> Result<Status, ApiError> {
    let user_id = token.sub();
    let user = User::update(pool.inner(), &user_id, &body).await?;

    if user.email_verified == false {
        let options = SendEmailVerification {
            user_id,
            project_id: project.id,
        };

        send_email_verification(&pool, options).await?;
    }

    Ok(Status::Ok)
}

#[post(
    "/admin/update?<user_id>&<project_id>",
    format = "json",
    data = "<body>"
)]
pub async fn admin_handler(
    pool: Db<'_>,
    user_id: Uuid,
    project_id: Uuid,
    body: Json<UpdateUser>,
    _admin: Admin,
) -> Result<Status, ApiError> {
    let user = User::update(pool.inner(), &user_id, &body).await?;

    if user.email_verified == false {
        let options = SendEmailVerification {
            user_id,
            project_id,
        };

        send_email_verification(&pool, options).await?;
    }

    Ok(Status::Ok)
}
