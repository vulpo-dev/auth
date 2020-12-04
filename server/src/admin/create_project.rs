use crate::data::admin::{Admin, NewProject};
use crate::data::keys::ProjectKeys;
use crate::data::AuthDb;
use crate::response::error::ApiError;

use rocket;
use rocket_contrib::json::Json;
use uuid::Uuid;

#[post("/__/create_project", data = "<body>")]
pub async fn handler(
    conn: AuthDb,
    body: Json<NewProject>,
    _admin: Admin,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    let id = conn
        .run(|client| {
            let mut trx = match client.transaction() {
                Ok(trx) => trx,
                Err(_) => return Err(ApiError::InternalServerError),
            };

            let id = Admin::create_project(&mut trx, body.into_inner())?;
            let keys = ProjectKeys::create_keys(id, true, None);
            ProjectKeys::insert(&mut trx, &keys)?;

            if let Err(_) = trx.commit() {
                return Err(ApiError::InternalServerError);
            }

            Ok(id)
        })
        .await?;

    Ok(Json([id]))
}
