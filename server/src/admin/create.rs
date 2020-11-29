use crate::db::get_query;
use crate::db::AuthDb;
use crate::error::ApiError;
use bcrypt::{hash, DEFAULT_COST};

use rocket;
use rocket_contrib::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct NewAdmin {
    pub email: String,
    pub password: String,
}

pub async fn create(conn: &AuthDb, body: NewAdmin) -> Result<Uuid, ApiError> {
    let query = get_query("admin/create")?;

    let password = match hash(body.password.clone(), DEFAULT_COST) {
        Err(_) => return Err(ApiError::InternalServerError),
        Ok(hashed) => hashed,
    };

    let row = conn
        .run(move |c| c.query_one(query, &[&body.email, &password]))
        .await;

    match row {
        Err(_) => Err(ApiError::NotFound),
        Ok(row) => Ok(row.get("id")),
    }
}

#[post("/__/create", data = "<body>")]
pub async fn handler(conn: AuthDb, body: Json<NewAdmin>) -> Result<Json<[Uuid; 1]>, ApiError> {
    let id = create(&conn, body.into_inner()).await?;
    Ok(Json([id]))
}
