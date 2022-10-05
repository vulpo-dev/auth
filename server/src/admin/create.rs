use crate::admin::data::{Admin, NewAdmin};
use crate::admin::has_admin::server_has_admin;
use crate::password::data::{Password, PasswordAlg};

use sqlx::PgPool;
use uuid::Uuid;
use vulpo_auth_types::error::ApiError;

pub async fn create_admin(
    pool: &PgPool,
    body: NewAdmin,
    project_id: &Uuid,
) -> Result<Uuid, ApiError> {
    let has_admin = server_has_admin(&pool).await?;

    if has_admin {
        return Err(ApiError::AdminHasAdmin);
    }

    let password = Password::hash(&body.password, &PasswordAlg::Argon2id)
        .map_err(|_| ApiError::InternalServerError)?;

    let admin = NewAdmin { password, ..body };

    let id = Admin::create(&pool, admin, project_id).await?;
    Ok(id)
}
