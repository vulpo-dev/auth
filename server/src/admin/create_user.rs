use crate::db::get_query;
use crate::db::AuthDb;
use crate::error::ApiError;
use bcrypt::{hash, DEFAULT_COST};

use rocket;
use rocket_contrib::databases::postgres::error::SqlState;
use rocket_contrib::json::Json;
use serde::Deserialize;
use serde_json::json;
use serde_json::value::Value;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct NewUser {
    pub email: String,
    pub project_id: Uuid,
    pub password: Option<String>,
    pub display_name: Option<String>,
    pub data: Option<Value>,
    pub provider_id: Option<String>,
}

pub async fn create(conn: &AuthDb, body: NewUser) -> Result<Uuid, ApiError> {
    let query = get_query("user/create")?;

    let password = match body.password {
        Some(ref password) => match hash(password.clone(), DEFAULT_COST) {
            Err(_) => return Err(ApiError::InternalServerError),
            Ok(hashed) => Some(hashed),
        },
        None => None,
    };

    let data = match body.data {
        Some(ref json) => json.clone(),
        None => json!({}),
    };

    let provider = match body.provider_id {
        Some(ref id) => id.clone(),
        None => String::from("email"),
    };

    let row = conn
        .run(move |c| {
            c.query_one(
                query,
                &[
                    &body.email,
                    &password,
                    &body.display_name,
                    &data,
                    &provider,
                    &body.project_id,
                ],
            )
        })
        .await;

    match row {
        Err(err) => match err.code() {
            Some(sql_state) => {
                if sql_state == &SqlState::UNIQUE_VIOLATION {
                    return Err(ApiError::UserExists);
                }

                if sql_state == &SqlState::FOREIGN_KEY_VIOLATION {
                    return Err(ApiError::UserInvalidProject);
                }

                Err(ApiError::InternalServerError)
            }
            None => Err(ApiError::InternalServerError),
        },
        Ok(row) => Ok(row.get("id")),
    }
}

#[post("/__/create_user", data = "<body>")]
pub async fn handler(conn: AuthDb, body: Json<NewUser>) -> Result<Json<[Uuid; 1]>, ApiError> {
    let id = create(&conn, body.into_inner()).await?;
    Ok(Json([id]))
}
