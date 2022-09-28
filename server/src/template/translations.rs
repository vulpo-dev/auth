use crate::admin::data::Admin;
use crate::template::data::{DeleteTranslation, SetTranslation, Translations};

use rocket::http::Status;
use rocket::serde::json::Json;
use serde_json;
use std::collections::HashMap;
use uuid::Uuid;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

type TranslationsResponse = HashMap<String, serde_json::Value>;

pub async fn get_translations(
    pool: &Db,
    project_id: Uuid,
    template: &str,
) -> Result<TranslationsResponse, ApiError> {
    let translations = Translations::get_by_project(&pool, &project_id, template).await?;
    Ok(translations.value)
}

#[get("/translations?<project>&<template>")]
pub async fn get_translations_handler(
    pool: Db,
    project: Uuid,
    template: String,
    _admin: Admin,
) -> Result<Json<TranslationsResponse>, ApiError> {
    let translations = get_translations(&pool, project, &template).await?;
    Ok(Json(translations))
}

pub async fn set_translation(pool: &Db, data: SetTranslation) -> Result<(), ApiError> {
    Translations::set(&pool, &data).await?;
    Ok(())
}

#[post("/translations/set", format = "json", data = "<body>")]
pub async fn set_translation_handler(
    pool: Db,
    body: Json<SetTranslation>,
    _admin: Admin,
) -> Result<Status, ApiError> {
    set_translation(&pool, body.into_inner()).await?;
    Ok(Status::Ok)
}

pub async fn delete_translation(pool: &Db, delete: DeleteTranslation) -> Result<(), ApiError> {
    Translations::delete(&pool, &delete).await?;
    Ok(())
}

#[post("/translations/delete", format = "json", data = "<body>")]
pub async fn delete_translation_handler(
    pool: Db,
    body: Json<DeleteTranslation>,
    _admin: Admin,
) -> Result<Status, ApiError> {
    delete_translation(&pool, body.into_inner()).await?;
    Ok(Status::Ok)
}
