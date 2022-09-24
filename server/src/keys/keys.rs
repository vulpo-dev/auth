use crate::keys::data::PublicKey;
use crate::response::error::ApiError;

use rocket::serde::{json::Json, uuid::Uuid, Serialize};
use std::str;
use werkbank::rocket::Db;

#[derive(Serialize)]
pub struct Key {
    pub id: Uuid,
    pub key: String,
}

pub async fn get_public_keys(pool: &Db, project: &Uuid) -> Result<Vec<Key>, ApiError> {
    let keys = PublicKey::get_by_project(&pool, &project).await?;
    let keys: Vec<Key> = keys
        .iter()
        .map(|item| Key {
            id: item.id,
            key: str::from_utf8(&item.key).unwrap().to_string(),
        })
        .collect();
    Ok(keys)
}

#[get("/public?<project>")]
pub async fn public(pool: Db, project: Uuid) -> Result<Json<Vec<Key>>, ApiError> {
    let keys = get_public_keys(&pool, &project).await?;
    Ok(Json(keys))
}
