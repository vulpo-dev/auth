use crate::db::get_query;
use crate::response::error::ApiError;

use rocket_contrib::databases::postgres::GenericClient;
use uuid::Uuid;

pub struct Project;

impl Project {
    pub fn set_settings<C: GenericClient>(
        client: &mut C,
        project: &Uuid,
        email: &str,
        domain: &str,
    ) -> Result<(), ApiError> {
        let query = get_query("project/set_settings")?;
        match client.query(query, &[&project, &email, &domain]) {
            Ok(_) => Ok(()),
            Err(_) => Err(ApiError::InternalServerError),
        }
    }

    pub fn domain<C: GenericClient>(client: &mut C, project: &Uuid) -> Result<String, ApiError> {
        let query = get_query("project/domain")?;
        match client.query_one(query, &[&project]) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(row) => Ok(row.get("domain")),
        }
    }
}
