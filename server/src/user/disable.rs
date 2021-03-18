use crate::admin::data::Admin;
use crate::db::Db;
use crate::response::error::ApiError;
use crate::user::data::User;

use rocket_contrib::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct Disable {
    pub user: Uuid,
    pub disabled: bool,
    pub project: Uuid,
}

#[post("/disable", data = "<body>")]
pub async fn handler(pool: Db<'_>, body: Json<Disable>, _admin: Admin) -> Result<(), ApiError> {
    if body.disabled {
        User::disable(pool.inner(), &body.user, &body.project).await?;
    } else {
        User::enable(pool.inner(), &body.user, &body.project).await?;
    }

    Ok(())
}
