use std::collections::HashMap;

use crate::response::error::ApiError;
use crate::template::config::{DefaultRedirect, DefaultSubject, Templates};
use crate::user::data::User;
use crate::TEMPLATE;

use handlebars::Handlebars;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Deserialize, Serialize)]
pub struct TemplateResponse {
    pub from_name: String,
    pub subject: String,
    pub body: String,
    pub redirect_to: String,
    pub of_type: Templates,
    pub project_id: Uuid,
}

#[derive(Deserialize, Serialize)]
pub struct SetTemplateView {
    pub body: String,
    pub name: String,
    pub project_id: Uuid,

    pub from_name: String,
    pub subject: String,
    pub redirect_to: String,
    pub of_type: Templates,
}

#[derive(Serialize)]
pub struct InitTemplates {
    pub id: Uuid,
    pub from_name: String,
    pub body: String,
    pub redirect_to: String,
    pub of_type: String,
    pub project_id: Uuid,
    pub translation: serde_json::Value,
    pub template_type: String,
    pub name: String,
}

struct File {
    pub path: &'static str,
    pub name: &'static str,
    pub translation: &'static str,
    pub template: Templates,
    pub template_type: &'static str,
}

const FILES: [File; 6] = [
    File {
        path: "index.hbs",
        translation: "",
        name: "index",
        template_type: "index",
        template: Templates::Index,
    },
    File {
        path: "component/button.hbs",
        translation: "",
        name: "button",
        template_type: "component",
        template: Templates::Button,
    },
    File {
        path: "view/change_email.hbs",
        translation: "translation/change_email.json",
        name: "change_email",
        template_type: "view",
        template: Templates::ChangeEmail,
    },
    File {
        path: "view/password_reset.hbs",
        translation: "translation/password_reset.json",
        name: "password_reset",
        template_type: "view",
        template: Templates::PasswordReset,
    },
    File {
        path: "view/passwordless.hbs",
        translation: "translation/passwordless.json",
        name: "passwordless",
        template_type: "view",
        template: Templates::Passwordless,
    },
    File {
        path: "view/verify_email.hbs",
        translation: "translation/verify_email.json",
        name: "verify_email",
        template_type: "view",
        template: Templates::VerifyEmail,
    },
];

#[derive(Debug)]
pub struct Template;

impl Template {
    pub async fn from_project(
        pool: &PgPool,
        project: Uuid,
        template: Templates,
    ) -> Result<Option<TemplateResponse>, ApiError> {
        let template = template.to_string();
        let row = sqlx::query!(
            r#"
                select template_data.from_name
                     , template_data.subject
                     , templates.body
                     , template_data.redirect_to
                     , template_data.of_type
                     , templates.project_id
                  from templates
                  join template_data on template_data.template_id = templates.id
                 where templates.project_id = $1
                   and templates.name = $2
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
            }
        });

        Ok(template)
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

    pub async fn get_translation(
        pool: &PgPool,
        project_id: Uuid,
        lang: &str,
        name: &str,
    ) -> Result<serde_json::Value, ApiError> {
        // todo: get default language from project in case language does not exist
        let translation = sqlx::query_as!(
            Translation,
            r#"
                select template_translations.content
                  from templates
                  join template_translations on template_translations.template_id = templates.id
                 where templates.project_id = $1
                   and templates.of_type = $2
                   and template_translations.language = $3
            "#,
            project_id,
            name,
            lang
        )
        .fetch_optional(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        if let Some(t) = translation {
            return Ok(t.content);
        }

        let files = FILES
            .iter()
            .filter(|file| file.name == name)
            .collect::<Vec<&File>>();

        let file = files.get(0);

        if let Some(file) = file {
            let content = TEMPLATE
                .get_file(file.translation)
                .unwrap()
                .contents_utf8()
                .unwrap();

            return Ok(serde_json::from_str(content).unwrap());
        }

        Ok(serde_json::Value::String(String::from("")))
    }

    async fn init_handlebars(pool: &PgPool) -> Result<Handlebars<'static>, ApiError> {
        let files = sqlx::query!(
            r#"
                select body
                     , name
                  from templates
                 where of_type = 'index'
                    or of_type = 'component'
            "#
        )
        .fetch_all(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        let mut handlebars = Handlebars::new();

        for file in files.into_iter() {
            if handlebars
                .register_template_string(&file.name, file.body)
                .is_err()
            {
                return Err(ApiError::InternalServerError);
            }
        }

        Ok(handlebars)
    }

    pub async fn insert_defaults(pool: &PgPool, project: &Uuid) -> Result<(), ApiError> {
        let templates = FILES
            .iter()
            .map(|file| {
                let content = TEMPLATE
                    .get_file(file.path)
                    .and_then(|f| f.contents_utf8())
                    .unwrap_or("");

                let translation = TEMPLATE
                    .get_file(file.translation)
                    .and_then(|f| f.contents_utf8())
                    .unwrap_or("{}");

                InitTemplates {
                    id: Uuid::new_v4(),
                    name: file.name.to_string(),
                    from_name: String::from(""),
                    body: content.to_string(),
                    redirect_to: DefaultRedirect::from_template(file.template),
                    of_type: file.template.to_string(),
                    project_id: project.clone(),
                    translation: serde_json::from_str::<serde_json::Value>(translation).unwrap(),
                    template_type: file.template_type.to_string(),
                }
            })
            .collect::<Vec<InitTemplates>>();

        let data = serde_json::to_value(&templates).unwrap();

        sqlx::query!(
            r#"
                with raw_template_data as (
                    select *
                     from jsonb_to_recordset($1)
                      as x(
                          id uuid
                        , body text
                        , project_id uuid
                        , template_type text
                        , name text
                      )
                )
                insert into templates
                select raw_template_data.id
                     , raw_template_data.body
                     , raw_template_data.name
                     , raw_template_data.template_type as of_type
                     , raw_template_data.project_id
                  from raw_template_data
            "#,
            &data,
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        sqlx::query!(
            r#"
                with raw_template_data as (
                    select *
                      from jsonb_to_recordset($1)
                        as x(
                           id uuid
                         , from_name text
                         , subject text
                         , redirect_to text
                         , of_type text
                         , template_type text
                         )
                )
                insert into template_data
                select raw_template_data.from_name
                     , '{{t.subject}}' as subject
                     , raw_template_data.id as template_id
                     , raw_template_data.redirect_to
                     , raw_template_data.of_type
                  from raw_template_data
                 where raw_template_data.template_type = 'view'
            "#,
            &data,
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        sqlx::query!(
            r#"
                with raw_template_data as (
                    select *
                      from jsonb_to_recordset($1)
                        as x(
                           id uuid
                         , translation jsonb
                         , template_type text
                         )
                )
                insert into template_translations
                select raw_template_data.id as template_id
                     , 'en' as language
                     , raw_template_data.translation
                  from raw_template_data
                 where raw_template_data.template_type = 'view'
            "#,
            &data,
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn render(
        pool: &PgPool,
        template: String,
        ctx: TemplateCtx,
    ) -> Result<String, ApiError> {
        let handlebars = Template::init_handlebars(pool).await?;

        let mut translations: HashMap<String, String> = HashMap::new();
        translations.insert(
            "text".to_string(),
            "Click on the link below to sign in to your {{project}} account".to_string(),
        );

        let translated: HashMap<&String, String> = translations
            .iter()
            .map(|kv| (kv.0, handlebars.render_template(kv.1, &ctx).unwrap()))
            .collect();

        let render_ctx = json!({
            "t": translated,
            "ctx": ctx,
        });

        let content = handlebars
            .render_template(&template, &render_ctx)
            .map_err(|_| ApiError::TemplateRender)?;

        handlebars
            .render("index", &json!({ "content": content }))
            .map_err(|_| ApiError::TemplateRender)
    }

    pub async fn set_template(pool: &PgPool, template: &SetTemplateView) -> Result<(), ApiError> {
        sqlx::query!(
            r#" 
                with insert_template as (
                    insert into templates(body, name, project_id, of_type)
                    values ($1, $2, $3, 'view')
                    on conflict (project_id, name) do update set body = $1
                    returning id
                )
                insert into template_data(from_name, subject, template_id, redirect_to, of_type)
                select $4 as from_name
                     , $5 as subject
                     , insert_template.id as template_id
                     , $6 as redirect_to
                     , $7 as of_type
                  from insert_template 
                on conflict (template_id, of_type)
                  do update set from_name = $4
                              , subject = $5
                              , redirect_to = $6
                
            "#,
            template.body,
            template.name,
            template.project_id,
            template.from_name,
            template.subject,
            template.redirect_to,
            template.of_type.to_string(),
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }
}

#[derive(Debug, Deserialize)]
pub struct Translation {
    content: serde_json::Value,
}

#[derive(Serialize)]
pub struct TemplateCtx {
    pub href: String,
    pub project: String,
    pub user: Option<User>,
}
