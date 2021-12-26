use crate::db::Db;
use crate::keys::data::PublicKey;
use crate::response::error::ApiError;

use rocket::serde::{json::Json, uuid::Uuid, Serialize};
use std::str;

#[derive(Serialize)]
pub struct Key {
    pub id: Uuid,
    pub key: String,
}

#[get("/public?<project>")]
pub async fn public(pool: Db, project: Uuid) -> Result<Json<Vec<Key>>, ApiError> {
    PublicKey::get_by_project(&pool, &project)
        .await
        .map(|keys| {
            keys.iter()
                .map(|item| Key {
                    id: item.id,
                    key: str::from_utf8(&item.key).unwrap().to_string(),
                })
                .collect()
        })
        .map(Json)
}
