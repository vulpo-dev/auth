use crate::response::error::ApiError;

use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Copy, Clone, Deserialize, Serialize, PartialEq)]
pub enum Flags {
    #[serde(rename = "auth::signin")]
    SignIn,
    #[serde(rename = "auth::signup")]
    SignUp,
    #[serde(rename = "action::password_reset")]
    PasswordReset,
    #[serde(rename = "action::verify_email")]
    VerifyEmail,
    #[serde(rename = "method::email_password")]
    EmailAndPassword,
    #[serde(rename = "method::authentication_link")]
    AuthenticationLink,

    #[serde(rename = "oauth::google")]
    OAuthGoogle,
}

impl Flags {
    pub async fn from_project(pool: &PgPool, id: &Uuid) -> Result<Vec<Flags>, ApiError> {
        let row = sqlx::query_file!("src/project/sql/get_flags.sql", id)
            .fetch_one(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

        let flags: Vec<Flags> = row
            .flags
            .iter()
            .map(|flag| Flags::from_str(&flag))
            .filter(|result| result.is_some())
            .map(|result| result.unwrap())
            .collect();

        Ok(flags)
    }

    pub async fn set_flags(pool: &PgPool, project: &Uuid, flags: &[Flags]) -> Result<(), ApiError> {
        let flags = flags
            .into_iter()
            .map(|flag| flag.to_string())
            .filter(|flag| flag.is_empty() == false)
            .collect::<Vec<String>>();

        sqlx::query_file!("src/project/sql/set_flags.sql", project, &flags)
            .execute(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn has_flags(
        pool: &PgPool,
        project: &Uuid,
        flags: &[Flags],
    ) -> Result<bool, ApiError> {
        let project_flags = Flags::from_project(pool, project).await?;

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

    // TODO figure out how to do this automatically?
    fn from_str(flag: &str) -> Option<Flags> {
        match flag {
            "auth::signin" => Some(Flags::SignIn),
            "auth::signup" => Some(Flags::SignUp),
            "action::password_reset" => Some(Flags::PasswordReset),
            "method::email_password" => Some(Flags::EmailAndPassword),
            "method::authentication_link" => Some(Flags::AuthenticationLink),
            "action::verify_email" => Some(Flags::VerifyEmail),
            "oauth::google" => Some(Flags::OAuthGoogle),
            _ => None,
        }
    }
}

impl ToString for Flags {
    fn to_string(&self) -> String {
        match self {
            Flags::SignIn => "auth::signin".to_string(),
            Flags::SignUp => "auth::signup".to_string(),
            Flags::PasswordReset => "action::password_reset".to_string(),
            Flags::EmailAndPassword => "method::email_password".to_string(),
            Flags::AuthenticationLink => "method::authentication_link".to_string(),
            Flags::VerifyEmail => "action::verify_email".to_string(),
            Flags::OAuthGoogle => "oauth::google".to_string(),
        }
    }
}
