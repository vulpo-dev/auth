mod config;
mod data;
mod template;
mod translations;

pub use config::Templates;
pub use config::{DefaultRedirect, DefaultSubject};
pub use data::Translations;
pub use template::{Template, TemplateCtx, TemplateResponse};

use crate::admin::data::Admin;

use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::serde::uuid::Uuid;
use rocket::Route;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

use self::template::SetTemplateView;

pub async fn get_template(
    pool: &Db,
    project_id: Uuid,
    template: &str,
) -> Result<TemplateResponse, ApiError> {
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

    Ok(result)
}

#[get("/?<project_id>&<template>")]
async fn get_template_handler(
    pool: Db,
    project_id: Uuid,
    template: String,
    _admin: Admin,
) -> Result<Json<TemplateResponse>, ApiError> {
    let result = get_template(&pool, project_id, &template).await?;
    Ok(Json(result))
}

pub async fn set_template(pool: &Db, payload: SetTemplateView) -> Result<(), ApiError> {
    let template = SetTemplateView {
        from_name: payload.from_name.trim().to_string(),
        subject: payload.subject.trim().to_string(),
        redirect_to: payload.redirect_to.trim().to_string(),
        ..payload
    };

    Template::set_template(&pool, &template).await?;

    Ok(())
}

#[post("/", format = "json", data = "<body>")]
async fn set_template_handler(
    pool: Db,
    body: Json<SetTemplateView>,
    _admin: Admin,
) -> Result<Status, ApiError> {
    let body = body.into_inner();
    set_template(&pool, body).await?;
    Ok(Status::Ok)
}

pub fn routes() -> Vec<Route> {
    routes![
        get_template_handler,
        set_template_handler,
        translations::get_translations_handler,
        translations::set_translation_handler,
        translations::delete_translation_handler,
    ]
}
