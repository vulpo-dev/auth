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
    Admin::create_user(pool.inner(), body.into_inner())
        .await
        .map(|id| [id])
        .map(Json)
}
