use crate::db::{get_query, AuthDb};
use crate::error::ApiError;
use rocket_contrib::json::Json;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct Project {
    pub id: Option<Uuid>,
}

async fn get_project(conn: &AuthDb) -> Result<Option<Uuid>, ApiError> {
    let query = get_query("admin/has_project")?;
    let rows = conn.run(move |c| c.query(query, &[])).await;

    match rows {
        Ok(result) => {
            if result.len() == 0 {
                Ok(None)
            } else {
                let row = result.get(0).unwrap();
                Ok(row.get("id"))
            }
        }
        Err(_) => return Err(ApiError::InternalServerError),
    }
}

#[get("/__/project/has")]
pub async fn has(conn: AuthDb) -> Result<Json<Project>, ApiError> {
    let id = get_project(&conn).await?;
    Ok(Json(Project { id }))
}

#[post("/__/project/create")]
pub async fn create(conn: AuthDb) -> Result<Json<Project>, ApiError> {
    let project = get_project(&conn).await?;

    if let Some(_) = project {
        return Err(ApiError::AdminProjectExists);
    }

    let query = get_query("admin/create_project")?;
    let row = conn
        .run(move |c| c.query_one(query, &[&String::from("Admin")]))
        .await;

    let id: Uuid = match row {
        Ok(result) => result.get("id"),
        Err(_) => return Err(ApiError::InternalServerError),
    };

    Ok(Json(Project { id: Some(id) }))
}
