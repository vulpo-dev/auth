use crate::admin::data::Admin;
use crate::db::AuthDb;
use crate::response::error::ApiError;
use crate::user::data::{PartialUser, SortDirection, TotalUsers, User, UserOrder};
use rocket_contrib::uuid::Uuid;

use rocket::http::RawStr;
use rocket_contrib::json::Json;
use serde::Serialize;
use std::str::FromStr;

#[get("/list?<project>&<order_by>&<sort>&<offset>&<limit>")]
pub async fn handler(
    conn: AuthDb,
    project: Uuid,
    order_by: &RawStr,
    sort: &RawStr,
    offset: &RawStr,
    limit: &RawStr,
    _admin: Admin,
) -> Result<Json<Response>, ApiError> {
    let offset = match offset.as_str().parse::<i64>() {
        Err(_) => return Err(ApiError::InternalServerError),
        Ok(offset) => offset,
    };

    let limit = match limit.as_str().parse::<i64>() {
        Err(_) => return Err(ApiError::InternalServerError),
        Ok(limit) => limit,
    };

    let order_by = match UserOrder::from_str(order_by.as_str()) {
        Err(_) => return Err(ApiError::InternalServerError),
        Ok(order) => order,
    };

    let direction = match SortDirection::from_str(sort.as_str()) {
        Err(_) => return Err(ApiError::InternalServerError),
        Ok(sort) => sort,
    };

    let users = conn
        .run(move |client| User::list(client, &project, &order_by, direction, offset, limit))
        .await?;

    let result = Response { items: users };

    Ok(Json(result))
}

#[derive(Serialize)]
pub struct Response {
    pub items: Vec<PartialUser>,
}

#[get("/total?<project>")]
pub async fn total(conn: AuthDb, project: Uuid) -> Result<Json<TotalUsers>, ApiError> {
    let result = conn
        .run(move |client| User::total(client, &project))
        .await?;
    Ok(Json(result))
}
