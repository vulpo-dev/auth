use crate::db::get_query;
use crate::db::AuthDb;
use crate::error::ApiError;

use rocket;
use rocket_contrib::json::Json;
use serde::Deserialize;

use rocket_contrib::databases::postgres::error::SqlState;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct NewProject {
    pub name: String,
}

pub async fn create(conn: &AuthDb, body: NewProject) -> Result<Uuid, ApiError> {
    let query = get_query("project/create")?;

    let name = body.name.clone();
    let row = conn.run(move |c| c.query_one(query, &[&name])).await;

    match row {
        Err(err) => match err.code() {
            Some(sql_state) => {
                if sql_state == &SqlState::UNIQUE_VIOLATION {
                    return Err(ApiError::ProjectNameExists);
                }

                Err(ApiError::InternalServerError)
            }
            None => Err(ApiError::InternalServerError),
        },
        Ok(row) => Ok(row.get("id")),
    }
}

#[post("/__/create_project", data = "<body>")]
pub async fn handler(conn: AuthDb, body: Json<NewProject>) -> Result<Json<[Uuid; 1]>, ApiError> {
    let id = create(&conn, body.into_inner()).await?;
    Ok(Json([id]))
}
