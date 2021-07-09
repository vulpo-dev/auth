use crate::admin::data::Admin;
use crate::db::Db;
use crate::response::error::ApiError;
use crate::user::data::{PartialUser, SortDirection, TotalUsers, User, UserOrder};
use rocket::serde::uuid::Uuid;

use rocket::serde::json::Json;
use serde::Serialize;
use std::str::FromStr;

#[get("/list?<project>&<order_by>&<sort>&<offset>&<limit>")]
pub async fn handler(
    pool: Db<'_>,
    project: Uuid,
    order_by: String,
    sort: String,
    offset: String,
    limit: String,
    _admin: Admin,
) -> Result<Json<Response>, ApiError> {
    let offset = offset
        .as_str()
        .parse::<i64>()
        .map_err(|_| ApiError::BadRequest)?;

    let limit = limit
        .as_str()
        .parse::<i64>()
        .map_err(|_| ApiError::BadRequest)?;

    let order_by = UserOrder::from_str(order_by.as_str()).map_err(|_| ApiError::BadRequest)?;
    let direction = SortDirection::from_str(sort.as_str()).map_err(|_| ApiError::BadRequest)?;

    User::list(pool.inner(), &project, &order_by, direction, offset, limit)
        .await
        .map(|items| Response { items })
        .map(Json)
}

#[derive(Serialize)]
pub struct Response {
    pub items: Vec<PartialUser>,
}

#[get("/total?<project>")]
pub async fn total(pool: Db<'_>, project: Uuid) -> Result<Json<TotalUsers>, ApiError> {
    User::total(pool.inner(), &project).await.map(Json)
}
