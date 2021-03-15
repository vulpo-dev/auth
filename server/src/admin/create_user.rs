use crate::admin::data::{Admin, NewUser};
use crate::db::Db;
use crate::response::error::ApiError;

use rocket;
use rocket_contrib::json::Json;
use uuid::Uuid;

#[post("/__/create_user", data = "<body>")]
pub async fn handler(
    pool: Db<'_>,
    body: Json<NewUser>,
    _admin: Admin,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    let id = Admin::create_user(pool.inner(), body.into_inner()).await?;
    Ok(Json([id]))
}
