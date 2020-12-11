use crate::data::{get_query, GenericClient};
use crate::response::error::ApiError;

use serde::{Deserialize, Serialize};

use uuid::Uuid;

#[derive(Debug, Copy, Clone, Deserialize, Serialize, PartialEq)]
pub enum Flags {
    #[serde(rename = "auth::signin")]
    SignIn,
    #[serde(rename = "auth::signup")]
    SignUp,
    #[serde(rename = "action::password_reset")]
    PasswordReset,
    #[serde(rename = "method::email_password")]
    EmailAndPassword,
    #[serde(rename = "method::authentication_link")]
    AuthenticationLink,
}

impl Flags {
    pub fn from_project<C: GenericClient>(
        client: &mut C,
        id: &Uuid,
    ) -> Result<Vec<Flags>, ApiError> {
        let query = get_query("project/get_flags")?;

        let row = client.query_one(query, &[&id]);

        let flags: Vec<String> = match row {
            Err(_) => return Err(ApiError::InternalServerError),
            Ok(row) => row.get("flags"),
        };

        let flags: Vec<Flags> = flags
            .iter()
            .map(|flag| Flags::from_str(&flag))
            .filter(|result| result.is_some())
            .map(|result| result.unwrap())
            .collect();

        Ok(flags)
    }

    pub fn has_flags<C: GenericClient>(
        c: &mut C,
        project: &Uuid,
        flags: &[Flags],
    ) -> Result<bool, ApiError> {
        let project_flags = Flags::from_project(c, project)?;

        let contains: Vec<bool> = flags
            .iter()
            .map(|flag| project_flags.contains(flag))
            .filter(|in_flags| *in_flags == false)
            .collect();

        if contains.len() == 0 {
            Ok(true)
        } else {
            Err(ApiError::Forbidden)
        }
    }

    // TODO do this automatically
    fn from_str(flag: &str) -> Option<Flags> {
        match flag {
            "auth::signin" => Some(Flags::SignIn),
            "auth::signup" => Some(Flags::SignUp),
            "action::password_reset" => Some(Flags::PasswordReset),
            "method::email_password" => Some(Flags::EmailAndPassword),
            "method::authentication_link" => Some(Flags::AuthenticationLink),
            _ => None,
        }
    }
}
