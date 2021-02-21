use crate::data::user::User;
use crate::data::{get_query, GenericClient};
use crate::response::error::ApiError;
use crate::TEMPLATE;

use handlebars::Handlebars;
use rocket::FromFormValue;
use serde::{Deserialize, Serialize};
use serde_json::json;
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

    pub fn from_project<C: GenericClient>(
        client: &mut C,
        project: Uuid,
        template: Templates,
    ) -> Result<Option<TemplateResponse>, ApiError> {
        let query = get_query("template/from_project")?;
        let template = template.to_string();
        let rows = client.query(query, &[&project, &template]);
        match rows {
            Err(err) => {
                println!("{:?}", err);
                Err(ApiError::InternalServerError)
            }
            Ok(rows) => Ok(rows.get(0).map(|row| {
                let of_type = Templates::from_string(row.get("of_type")).unwrap();
                TemplateResponse {
                    from_name: row.get("from_name"),
                    subject: row.get("subject"),
                    body: row.get("body"),
                    redirect_to: row.get("redirect_to"),
                    of_type,
                    project_id: row.get("project_id"),
                    is_default: row.get("is_default"),
                    language: row.get("template"),
                }
            })),
        }
    }

    pub fn set_template<C: GenericClient>(
        client: &mut C,
        template: &TemplateResponse,
    ) -> Result<(), ApiError> {
        let query = get_query("template/set_template")?;
        match client.query(
            query,
            &[
                &template.from_name,
                &template.subject,
                &template.body,
                &template.redirect_to,
                &template.of_type.to_string(),
                &template.project_id,
                &template.language,
            ],
        ) {
            Err(err) => {
                println!("{:?}", err);
                Err(ApiError::InternalServerError)
            }

            Ok(_) => Ok(()),
        }
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
            .unwrap()
    }

    pub fn render(template: String, ctx: TemplateCtx) -> Result<String, RenderError> {
        let handlebars = Template::init_handlebars();
        let content = match handlebars.render_template(&template, &ctx) {
            Err(_) => return Err(RenderError),
            Ok(value) => value,
        };

        match handlebars.render("index", &json!({ "content": content })) {
            Err(_) => Err(RenderError),
            Ok(val) => Ok(val),
        }
    }
}

#[derive(Serialize)]
pub struct TemplateCtx {
    pub href: String,
    pub project: String,
    pub user: Option<User>,
}
