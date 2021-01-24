use crate::data::admin::Admin;
use crate::data::project::Flags;
use crate::data::AuthDb;
use crate::response::error::ApiError;
use uuid::Uuid;

use rocket_contrib::json::Json;
use serde::Deserialize;

#[post("/set_flags", data = "<body>")]
pub async fn handler(conn: AuthDb, body: Json<Payload>, _admin: Admin) -> Result<(), ApiError> {
    conn.run(move |client| Flags::set_flags(client, &body.project, &body.flags))
        .await?;

    Ok(())
}

#[derive(Deserialize)]
pub struct Payload {
    pub flags: Vec<Flags>,
    pub project: Uuid,
}
