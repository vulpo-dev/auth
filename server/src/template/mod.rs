mod config;
mod data;
mod template;
mod translations;

pub use config::{DefaultRedirect, DefaultSubject};

use crate::admin::data::Admin;
use crate::db::Db;
use crate::response::error::ApiError;
pub use config::Templates;
pub use data::Translations;
pub use template::{Template, TemplateCtx, TemplateResponse};

use rocket::serde::json::Json;
use rocket::serde::uuid::Uuid;
use rocket::Route;

use self::template::SetTemplateView;

#[get("/?<project_id>&<template>")]
async fn get_template(
    pool: Db,
    project_id: Uuid,
    template: String,
    _admin: Admin,
) -> Result<Json<TemplateResponse>, ApiError> {
    let template = match Templates::from_string(&template) {
        Some(template) => template,
        None => return Err(ApiError::BadRequest),
    };

    let entry = Template::from_project(&pool, project_id, template).await?;
    let result = match entry {
        None => {
            let body = Template::get_body(template);
            TemplateResponse {
                from_name: String::from(""),
                subject: DefaultSubject::from_template(template),
                body: body.to_string(),
                redirect_to: DefaultRedirect::from_template(template),
                of_type: template,
                project_id,
            }
        }
        Some(t) => t,
    };

    Ok(Json(result))
}

#[post("/", format = "json", data = "<body>")]
async fn set_template(
    pool: Db,
    body: Json<SetTemplateView>,
    _admin: Admin,
) -> Result<(), ApiError> {
    let body = body.into_inner();

    let template = SetTemplateView {
        from_name: body.from_name.trim().to_string(),
        subject: body.subject.trim().to_string(),
        redirect_to: body.redirect_to.trim().to_string(),
        ..body
    };

    Template::set_template(&pool, &template).await?;

    Ok(())
}

pub fn routes() -> Vec<Route> {
    routes![
        get_template,
        set_template,
        translations::get_translations,
        translations::set_translation,
        translations::delete_translation,
    ]
}
