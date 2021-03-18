use crate::response::error::ApiError;
use crate::user::data::User;
use crate::TEMPLATE;

use handlebars::Handlebars;
use rocket::FromFormValue;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

pub struct RenderError;

#[derive(Deserialize, Serialize)]
pub struct TemplateResponse {
    pub from_name: String,
    pub subject: String,
    pub body: String,
    pub redirect_to: String,
    pub of_type: Templates,
    pub project_id: Uuid,
    pub is_default: bool,
    pub language: String,
}

#[derive(Debug, Deserialize, Serialize, PartialEq, FromFormValue, Copy, Clone)]
pub enum Templates {
    #[serde(rename = "change_email")]
    #[form(value = "change_email")]
    ChangeEmail,

    #[serde(rename = "password_reset")]
    #[form(value = "password_reset")]
    PasswordReset,

    #[serde(rename = "passwordless")]
    #[form(value = "passwordless")]
    Passwordless,

    #[serde(rename = "verify_email")]
    #[form(value = "verify_email")]
    VerifyEmail,

    #[serde(rename = "index")]
    #[form(value = "index")]
    Index,

    #[serde(rename = "button")]
    #[form(value = "button")]
    Button,
}

impl Templates {
    pub fn from_string(s: &str) -> Option<Templates> {
        match s {
            "change_email" => Some(Templates::ChangeEmail),
            "password_reset" => Some(Templates::PasswordReset),
            "passwordless" => Some(Templates::Passwordless),
            "verify_email" => Some(Templates::VerifyEmail),
            "index" => Some(Templates::Index),
            "button" => Some(Templates::Button),
            _ => None,
        }
    }
}

impl ToString for Templates {
    fn to_string(&self) -> String {
        match self {
            Templates::ChangeEmail => String::from("change_email"),
            Templates::PasswordReset => String::from("password_reset"),
            Templates::Passwordless => String::from("passwordless"),
            Templates::VerifyEmail => String::from("verify_email"),
            Templates::Index => String::from("index"),
            Templates::Button => String::from("button"),
        }
    }
}

struct File {
    pub path: &'static str,
    pub name: &'static str,
    pub template: Templates,
}

const FILES: [File; 6] = [
    File {
        path: "index.hbs",
        name: "index",
        template: Templates::Index,
    },
    File {
        path: "partial/button.hbs",
        name: "button",
        template: Templates::Button,
    },
    File {
        path: "partial/change_email.hbs",
        name: "change_email",
        template: Templates::ChangeEmail,
    },
    File {
        path: "partial/password_reset.hbs",
        name: "password_reset",
        template: Templates::PasswordReset,
    },
    File {
        path: "partial/passwordless.hbs",
        name: "passwordless",
        template: Templates::Passwordless,
    },
    File {
        path: "partial/verify_email.hbs",
        name: "verify_email",
        template: Templates::VerifyEmail,
    },
];

#[derive(Debug)]
pub struct Template;

impl Template {
    fn init_handlebars() -> Handlebars<'static> {
        let mut handlebars = Handlebars::new();

        FILES.iter().for_each(|file| {
            let content = TEMPLATE
                .get_file(file.path)
                .unwrap()
                .contents_utf8()
                .unwrap();

            assert!(handlebars
                .register_template_string(file.name, content)
                .is_ok());
        });

        handlebars
    }

    pub async fn from_project(
        pool: &PgPool,
        project: Uuid,
        template: Templates,
    ) -> Result<Option<TemplateResponse>, ApiError> {
        let template = template.to_string();
        let row = sqlx::query!(
            r#"
                select from_name
                     , subject
                     , body
                     , redirect_to
                     , of_type
                     , project_id
                     , false as is_default
                     , language
                  from templates
                 where project_id = $1
                   and of_type = $2
            "#,
            project,
            template
        )
        .fetch_optional(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        let template = row.map(|template| {
            let of_type = Templates::from_string(&template.of_type).unwrap();
            TemplateResponse {
                from_name: template.from_name,
                subject: template.subject,
                body: template.body,
                redirect_to: template.redirect_to,
                of_type,
                project_id: template.project_id,
                is_default: template.is_default.unwrap(),
                language: template.language,
            }
        });

        Ok(template)
    }

    pub async fn set_template(pool: &PgPool, template: &TemplateResponse) -> Result<(), ApiError> {
        sqlx::query!(
            r#"
                insert into templates(from_name, subject, body, redirect_to, of_type, project_id, language)
                values ($1, $2, $3, $4, $5, $6, $7)
                on conflict (project_id, of_type)
                  do update
                        set from_name = $1
                          , subject = $2
                          , body = $3
                          , redirect_to = $4
                          , language = $7
            "#,
            template.from_name,
            template.subject,
            template.body,
            template.redirect_to,
            template.of_type.to_string(),
            template.project_id,
            template.language,
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub fn get_body(template: Templates) -> &'static str {
        FILES
            .iter()
            .find(|&file| file.template == template)
            .map(|file| {
                TEMPLATE
                    .get_file(file.path)
                    .unwrap()
                    .contents_utf8()
                    .unwrap()
            })
            .unwrap_or("")
    }

    pub fn render(template: String, ctx: TemplateCtx) -> Result<String, RenderError> {
        let handlebars = Template::init_handlebars();
        let content = handlebars
            .render_template(&template, &ctx)
            .map_err(|_| RenderError)?;

        handlebars
            .render("index", &json!({ "content": content }))
            .map_err(|_| RenderError)
    }
}

#[derive(Serialize)]
pub struct TemplateCtx {
    pub href: String,
    pub project: String,
    pub user: Option<User>,
}
