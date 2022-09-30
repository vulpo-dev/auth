use crate::admin::data::Admin;
use crate::project::Project;
use crate::session::data::{RefreshAccessToken, Session};

use rocket;
use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::serde::uuid::Uuid;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

pub async fn validate_session(
    pool: &Db,
    session_id: &Uuid,
    rat: RefreshAccessToken,
    project_id: Uuid,
) -> Result<(), ApiError> {
    let session = Session::get(&pool, &session_id).await?;
    let claims = Session::validate_token(&session, &rat)?;
    let is_valid = Session::is_valid(&pool, &claims, &session_id, &project_id).await?;

    if !is_valid {
        return Err(ApiError::Forbidden);
    }

    Ok(())
}

pub async fn sign_out(
    pool: &Db,
    session_id: Uuid,
    rat: RefreshAccessToken,
    project_id: Uuid,
) -> Result<(), ApiError> {
    validate_session(&pool, &session_id, rat, project_id).await?;
    Session::delete(&pool, &session_id).await?;
    Ok(())
}

#[post("/sign_out/<session_id>", format = "json", data = "<rat>")]
pub async fn sign_out_handler(
    pool: Db,
    session_id: Uuid,
    rat: Json<RefreshAccessToken>,
    project: Project,
) -> Result<Status, ApiError> {
    sign_out(&pool, session_id, rat.into_inner(), project.id).await?;
    Ok(Status::Ok)
}

pub async fn admin_sign_out(pool: &Db, user_id: Uuid) -> Result<(), ApiError> {
    Session::delete_by_user(&pool, &user_id).await?;
    Ok(())
}

#[post("/admin/sign_out/<user_id>")]
pub async fn admin_sign_out_handler(
    pool: Db,
    user_id: Uuid,
    _admin: Admin,
) -> Result<(), ApiError> {
    admin_sign_out(&pool, user_id).await?;
    Ok(())
}

pub async fn sign_out_all(
    pool: &Db,
    session_id: Uuid,
    rat: RefreshAccessToken,
    project_id: Uuid,
) -> Result<(), ApiError> {
    validate_session(&pool, &session_id, rat, project_id).await?;
    Session::delete_all(&pool, &session_id).await?;
    Ok(())
}

#[post("/sign_out_all/<session_id>", format = "json", data = "<rat>")]
pub async fn sign_out_all_handler(
    pool: Db,
    session_id: Uuid,
    rat: Json<RefreshAccessToken>,
    project: Project,
) -> Result<Status, ApiError> {
    sign_out_all(&pool, session_id, rat.into_inner(), project.id).await?;
    Ok(Status::Ok)
}
