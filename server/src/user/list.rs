use crate::admin::data::Admin;
use crate::user::data::{Cursor, PartialUser, SortDirection, TotalUsers, User};
use rocket::serde::uuid::Uuid;

use rocket::serde::json::Json;
use serde::Serialize;
use std::str::FromStr;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

pub async fn get_users(
    pool: &Db,
    project: Uuid,
    sort: &str,
    limit: i64,
    cursor: Option<Cursor>,
) -> Result<Vec<PartialUser>, ApiError> {
    let direction = SortDirection::from_str(sort).map_err(|_| ApiError::BadRequest)?;
    let items = User::list(&pool, &project, direction, cursor, limit).await?;
    Ok(items)
}

#[get("/list?<project>&<sort>&<limit>&<cursor>")]
pub async fn handler(
    pool: Db,
    project: Uuid,
    sort: String,
    limit: String,
    cursor: Option<String>,
    _admin: Admin,
) -> Result<Json<Response>, ApiError> {
    let limit = limit.parse::<i64>().map_err(|_| ApiError::BadRequest)?;
    let cursor = cursor.and_then(|value| Cursor::from_str(&value).ok());
    println!("{:?}", cursor);
    let items = get_users(&pool, project, &sort, limit, cursor).await?;

    // If less items then the limit are returned then we
    // can skip generating a new cursor
    let last_user = if items.len() == limit as usize {
        items.last()
    } else {
        None
    };

    let next_cursor = if let Some(last_user) = last_user {
        let cursor = Cursor {
            created_at: last_user.created_at,
        };

        get_users(&pool, project, &sort, 2, Some(cursor))
            .await?
            .iter()
            .find(|user| user.id != last_user.id)
            .map(Cursor::from_partial_user)
            .map(|cursor| cursor.to_string())
    } else {
        None
    };

    Ok(Json(Response {
        items,
        cursor: next_cursor,
    }))
}

#[derive(Serialize)]
pub struct Response {
    pub items: Vec<PartialUser>,
    pub cursor: Option<String>,
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
