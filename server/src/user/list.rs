use crate::admin::data::Admin;
use crate::db::Db;
use crate::response::error::ApiError;
use crate::user::data::{PartialUser, SortDirection, TotalUsers, User, UserOrder};
use rocket::serde::uuid::Uuid;

use rocket::serde::json::Json;
use serde::Serialize;
use std::str::FromStr;

pub async fn get_users(
    pool: &Db,
    project: Uuid,
    order_by: &str,
    sort: &str,
    offset: &str,
    limit: &str,
) -> Result<Vec<PartialUser>, ApiError> {
    let offset = offset.parse::<i64>().map_err(|_| ApiError::BadRequest)?;
    let limit = limit.parse::<i64>().map_err(|_| ApiError::BadRequest)?;

    let order_by = UserOrder::from_str(order_by).map_err(|_| ApiError::BadRequest)?;
    let direction = SortDirection::from_str(sort).map_err(|_| ApiError::BadRequest)?;

    let items = User::list(&pool, &project, &order_by, direction, offset, limit).await?;
    Ok(items)
}

#[get("/list?<project>&<order_by>&<sort>&<offset>&<limit>")]
pub async fn handler(
    pool: Db,
    project: Uuid,
    order_by: String,
    sort: String,
    offset: String,
    limit: String,
    _admin: Admin,
) -> Result<Json<Response>, ApiError> {
    let items = get_users(&pool, project, &order_by, &sort, &offset, &limit).await?;
    Ok(Json(Response { items }))
}

#[derive(Serialize)]
pub struct Response {
    pub items: Vec<PartialUser>,
}

pub async fn get_total(pool: &Db, project_id: &Uuid) -> Result<TotalUsers, ApiError> {
    let total = User::total(&pool, &project_id).await?;
    Ok(total)
}

#[get("/total?<project>")]
pub async fn total(pool: Db, project: Uuid) -> Result<Json<TotalUsers>, ApiError> {
    let total = get_total(&pool, &project).await?;
    Ok(Json(total))
}
