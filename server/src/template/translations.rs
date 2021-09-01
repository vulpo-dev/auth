use crate::admin::data::Admin;
use crate::db::Db;
use crate::response::error::ApiError;
use crate::template::data::{DeleteTranslation, SetTranslation, Translations};

use rocket::http::Status;
use rocket::serde::json::Json;
use serde_json;
use std::collections::HashMap;
use uuid::Uuid;

type TranslationsResponse = HashMap<String, serde_json::Value>;

#[get("/translations?<project>&<template>")]
pub async fn get_translations(
    pool: Db,
    project: Uuid,
    template: String,
    _admin: Admin,
) -> Result<Json<TranslationsResponse>, ApiError> {
    Translations::get_by_project(&pool, &project, &template)
        .await
        .map(|t| t.value)
        .map(Json)
}

#[post("/translations/set", format = "json", data = "<body>")]
pub async fn set_translation(
    pool: Db,
    body: Json<SetTranslation>,
    _admin: Admin,
) -> Result<Status, ApiError> {
    Translations::set(&pool, &body).await.map(|_| Status::Ok)
}

#[post("/translations/delete", format = "json", data = "<body>")]
pub async fn delete_translation(
    pool: Db,
    body: Json<DeleteTranslation>,
    _admin: Admin,
) -> Result<Status, ApiError> {
    Translations::delete(&pool, &body).await.map(|_| Status::Ok)
}
