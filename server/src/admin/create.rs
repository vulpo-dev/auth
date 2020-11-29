use crate::db::get_query;
use crate::db::AuthDb;
use crate::error::ApiError;
use bcrypt::{hash, DEFAULT_COST};

use crate::admin::has_admin;
use crate::admin::Admin;
use crate::project::Project;
use rocket;
use rocket_contrib::databases::postgres::error::DbError;
use rocket_contrib::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct NewAdmin {
    pub email: String,
    pub password: String,
}

pub async fn create(conn: &AuthDb, body: NewAdmin, project: Uuid) -> Result<Uuid, ApiError> {
    let query = get_query("admin/create")?;

    let password = match hash(body.password.clone(), DEFAULT_COST) {
        Err(_) => return Err(ApiError::InternalServerError),
        Ok(hashed) => hashed,
    };

    let row = conn
        .run(move |c| c.query_one(query, &[&body.email, &password, &project]))
        .await;

    match row {
        Err(err) => {
            if let Some(db_error) = err.into_source().unwrap().downcast_ref::<DbError>() {
                println!("{:?}", db_error);
                return match db_error.constraint() {
                    Some("users_project_id_fkey") => Err(ApiError::ProjectNotFound),
                    Some("users_project_id_email_key") => Err(ApiError::AdminExists),
                    _ => Err(ApiError::InternalServerError),
                };
            }

            Err(ApiError::InternalServerError)
        }
        Ok(row) => Ok(row.get("id")),
    }
}

#[post("/__/create", data = "<body>")]
pub async fn handler(
    conn: AuthDb,
    body: Json<NewAdmin>,
    project: Project,
    _admin: Admin,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    let id = create(&conn, body.into_inner(), project.id).await?;
    Ok(Json([id]))
}

#[post("/__/create_once", data = "<body>")]
pub async fn create_once(
    conn: AuthDb,
    body: Json<NewAdmin>,
    project: Project,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    if has_admin::has_admin(&conn).await? {
        return Err(ApiError::AdminHasAdmin);
    }

    let id = create(&conn, body.into_inner(), project.id).await?;
    Ok(Json([id]))
}
