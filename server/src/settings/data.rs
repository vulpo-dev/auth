use crate::data::{get_query, GenericClient};
use crate::response::error::ApiError;

use serde::{Deserialize, Serialize};
use std::convert::TryFrom;
use uuid::Uuid;

pub struct ProjectEmail;

impl ProjectEmail {
    pub fn from_project<C: GenericClient>(
        client: &mut C,
        project_id: Uuid,
    ) -> Result<Option<EmailSettings>, ApiError> {
        let query = get_query("settings/get_email")?;
        let rows = client.query(query, &[&project_id]);

        let settings = match rows {
            Err(_) => return Err(ApiError::InternalServerError),
            Ok(value) => value,
        };

        let row = match settings.get(0) {
            None => return Ok(None),
            Some(val) => val,
        };

        let port: i32 = row.get("port");

        let settings = EmailSettings {
            from_name: row.get("from_name"),
            from_email: row.get("from_email"),
            password: row.get("password"),
            username: row.get("username"),
            port: u16::try_from(port).unwrap(),
            host: row.get("host"),
        };

        Ok(Some(settings))
    }

    pub fn insert<C: GenericClient>(
        client: &mut C,
        project_id: Uuid,
        settings: EmailSettings,
    ) -> Result<(), ApiError> {
        let query = get_query("settings/set_email")?;
        let port = settings.port as i32;

        let row = client.query(
            query,
            &[
                &project_id,
                &settings.host,
                &settings.from_name,
                &settings.from_email,
                &settings.password,
                &settings.username,
                &port,
            ],
        );

        match row {
            Err(err) => {
                println!("{:?}", err);
                Err(ApiError::InternalServerError)
            }
            Ok(_) => Ok(()),
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct EmailSettings {
    pub from_name: String,
    pub from_email: String,
    pub password: String,
    pub username: String,
    pub port: u16,
    pub host: String,
}
