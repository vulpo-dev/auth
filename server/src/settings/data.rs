use crate::data::{get_query, GenericClient};
use crate::response::error::ApiError;

use serde::{Deserialize, Serialize};
use serde_json;
use uuid::Uuid;

pub struct ProjectEmail;

impl ProjectEmail {
    pub fn from_project<C: GenericClient>(
        client: &mut C,
        project_id: Uuid,
    ) -> Result<Settings, ApiError> {
        let query = get_query("settings/get_email")?;
        let row = client.query_one(query, &[&project_id]);

        let settings = match row {
            Err(_) => return Err(ApiError::InternalServerError),
            Ok(value) => value,
        };

        let value: Option<serde_json::Value> = settings.get("email");
        let value = match value {
            None => {
                return Ok(Settings {
                    provider: EmailProvider::None,
                    settings: EmailSettings::None,
                })
            }
            Some(v) => v,
        };

        let settings: Settings = serde_json::from_value(value).unwrap();
        Ok(settings)
    }

    pub fn insert<C: GenericClient>(
        client: &mut C,
        project_id: Uuid,
        settings: Settings,
    ) -> Result<(), ApiError> {
        let query = get_query("settings/set_email")?;

        let settings = serde_json::to_value(&settings).unwrap();
        let row = client.query(query, &[&project_id, &settings]);

        match row {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(_) => Ok(()),
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub enum EmailProvider {
    #[serde(rename = "mailgun")]
    Mailgun,

    #[serde(rename = "none")]
    None,
}

#[derive(Debug, Deserialize, Serialize)]
pub enum EmailSettings {
    #[serde(rename = "mailgun")]
    MailGun {
        domain: String,
        from_name: String,
        from_email: String,
        api_key: String,
        username: String,
    },

    #[serde(rename = "none")]
    None,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Settings {
    pub provider: EmailProvider,
    pub settings: EmailSettings,
}
