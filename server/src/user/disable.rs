use crate::admin::data::Admin;
use crate::user::data::User;

use rocket::http::Status;
use rocket::serde::json::Json;
use serde::Deserialize;
use uuid::Uuid;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

#[derive(Deserialize)]
pub struct Disable {
    pub user: Uuid,
    pub disabled: bool,
    pub project: Uuid,
}

pub async fn disable(pool: &Db, body: Disable) -> Result<(), ApiError> {
    if body.disabled {
        User::disable(&pool, &body.user, &body.project).await?;
    } else {
        User::enable(&pool, &body.user, &body.project).await?;
    }

    Ok(())
}

#[post("/disable", format = "json", data = "<body>")]
pub async fn handler(pool: Db, body: Json<Disable>, _admin: Admin) -> Result<Status, ApiError> {
    disable(&pool, body.into_inner()).await?;
    Ok(Status::Ok)
}
