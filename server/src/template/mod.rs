mod template;

use crate::data::admin::Admin;
use crate::data::AuthDb;
use crate::response::error::ApiError;
pub use template::Template;
use template::{TemplateResponse, Templates};

use rocket::Route;
use rocket_contrib::json::Json;
use rocket_contrib::uuid::Uuid as RUuid;

#[get("/?<project>&<template>")]
async fn get_template(
    conn: AuthDb,
    project: RUuid,
    template: Templates,
    _admin: Admin,
) -> Result<Json<TemplateResponse>, ApiError> {
    let project_id = project.into_inner();
    let entry = conn
        .run(move |client| Template::from_project(client, project_id, template))
        .await?;

    let result = match entry {
        None => {
            let body = Template::get_body(template);
            TemplateResponse {
                from_name: String::from(""),
                subject: String::from(""),
                body: body.to_string(),
                redirect_to: String::from(""),
                of_type: template,
                project_id: project.into_inner(),
                is_default: true,
            }
        }
        Some(t) => t,
    };

    Ok(Json(result))
}

#[post("/", data = "<body>")]
async fn set_template(
    conn: AuthDb,
    body: Json<TemplateResponse>,
    _admin: Admin,
) -> Result<(), ApiError> {
    conn.run(move |client| Template::set_template(client, &body))
        .await?;

    Ok(())
}

pub fn routes() -> Vec<Route> {
    routes![get_template, set_template]
}
