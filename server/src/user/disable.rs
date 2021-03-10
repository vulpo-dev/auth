use crate::data::admin::Admin;
use crate::data::user::User;
use crate::data::AuthDb;
use crate::response::error::ApiError;

use rocket_contrib::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct Disable {
    pub user: Uuid,
    pub disabled: bool,
    pub project: Uuid,
}

#[post("/disable", data = "<body>")]
pub async fn handler(conn: AuthDb, body: Json<Disable>, _admin: Admin) -> Result<(), ApiError> {
    conn.run(move |client| {
        if body.disabled {
            User::disable(client, &body.user, &body.project)
        } else {
            User::enable(client, &body.user, &body.project)
        }
    })
    .await?;

    Ok(())
}
