use crate::admin;
use crate::config::{DbConfig, Secrets};
use crate::cors::CORS;
use crate::db;
use crate::keys;
use crate::password;
use crate::passwordless;
use crate::project;
use crate::session;
use crate::settings;
use crate::template;
use crate::user;

use figment::Figment;
use rocket::fairing::AdHoc;

pub async fn start(config: Figment, db_config: &DbConfig, secrets: Secrets) {
    let _ = rocket::custom(config)
        .attach(CORS())
        .attach(AdHoc::on_ignite("Add Secrets", |rocket| async move {
            rocket.manage(secrets)
        }))
        .attach(db::create_pool(&db_config))
        .mount("/dashboard", admin::dashboard())
        .mount("/admin", admin::routes())
        .mount("/user", user::routes())
        .mount("/passwordless", passwordless::routes())
        .mount("/password", password::routes())
        .mount("/token", session::routes())
        .mount("/project", project::routes())
        .mount("/settings", settings::routes())
        .mount("/template", template::routes())
        .mount("/keys", keys::routes())
        .launch()
        .await;
}

pub fn get_port(port: Option<&str>) -> Option<u16> {
    port.and_then(|value| value.parse::<u16>().ok())
}
