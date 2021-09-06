use crate::response::error::ApiError;
use crate::template::{DefaultRedirect, DefaultSubject, Template, Templates};

use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::convert::TryFrom;
use uuid::Uuid;

pub struct ProjectEmail;

impl ProjectEmail {
    pub async fn from_project(
        pool: &PgPool,
        project_id: Uuid,
    ) -> Result<Option<EmailSettings>, ApiError> {
        let row = sqlx::query_file!("src/settings/sql/get_email_settings.sql", project_id)
            .fetch_optional(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

        let settings = row.map(|row| EmailSettings {
            from_name: row.from_name,
            from_email: row.from_email,
            password: row.password,
            username: row.username,
            port: u16::try_from(row.port).unwrap(),
            host: row.host,
        });

        Ok(settings)
    }

    pub async fn from_project_template(
        pool: &PgPool,
        project_id: &Uuid,
        template: Templates,
    ) -> Result<TemplateEmail, ApiError> {
        let row = sqlx::query_file!(
            "src/settings/sql/get_template_settings.sql",
            project_id,
            template.to_string()
        )
        .fetch_one(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        let email = EmailSettings {
            from_name: row.from_name,
            from_email: row.from_email,
            password: row.password,
            username: row.username,
            port: u16::try_from(row.port).unwrap(),
            host: row.host,
        };

        let subject = row
            .subject
            .unwrap_or_else(|| DefaultSubject::from_template(template));

        let body = row
            .body
            .unwrap_or_else(|| Template::get_body(template).to_string());

        let redirect_to = row
            .redirect_to
            .unwrap_or_else(|| DefaultRedirect::from_template(template));

        Ok(TemplateEmail {
            email,
            redirect_to,
            subject,
            body,
            domain: row.domain,
            name: row.name,
        })
    }

    pub async fn insert(
        pool: &PgPool,
        project_id: Uuid,
        settings: EmailSettings,
    ) -> Result<(), ApiError> {
        let port = settings.port as i32;
        sqlx::query_file!(
            "src/settings/sql/insert_email_settings.sql",
            project_id,
            settings.host,
            settings.from_name,
            settings.from_email,
            settings.password,
            settings.username,
            port,
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
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

pub struct TemplateEmail {
    pub email: EmailSettings,
    pub redirect_to: String,
    pub subject: String,
    pub body: String,
    pub domain: String,
    pub name: String,
}
