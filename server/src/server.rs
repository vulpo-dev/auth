use crate::admin;
use crate::api_key;
use crate::config::Secrets;
use crate::cors::CORS;
use crate::keys;
use crate::oauth;
use crate::password;
use crate::passwordless;
use crate::project;
use crate::session;
use crate::settings;
use crate::template;
use crate::user;

use figment::providers::Env;
use figment::Figment;
use rocket::fairing::AdHoc;
use werkbank::rocket::{db, Cache, TracingFairing};

pub async fn start(figment: &Figment, port: Option<u16>, secrets: Secrets) {
    let rocket_config = Figment::from(rocket::Config::default())
        .merge(figment.clone().select("server"))
        .merge(Env::prefixed("VULPO_SERVER_").global());

    let config = match port {
        None => rocket_config,
        Some(port) => rocket_config.merge(("port", port)),
    };

    let _ = rocket::custom(config)
        .attach(TracingFairing)
        .attach(CORS)
        .attach(AdHoc::on_ignite("Add Secrets", |rocket| async move {
            rocket.manage(secrets)
        }))
        .attach(Cache::fairing(&figment))
        .attach(db::create_pool(&figment))
        .mount("/", admin::redirect())
        .mount("/dashboard", admin::dashboard())
        .mount("/api/admin", admin::routes())
        .mount("/api/user", user::routes())
        .mount("/api/passwordless", passwordless::routes())
        .mount("/api/password", password::routes())
        .mount("/api/token", session::routes())
        .mount("/api/project", project::routes())
        .mount("/api/settings", settings::routes())
        .mount("/api/template", template::routes())
        .mount("/api/keys", keys::routes())
        .mount("/api/api_key", api_key::routes())
        .mount("/api/oauth", oauth::routes())
        .launch()
        .await;
}

pub fn get_port(port: Option<&String>) -> Option<u16> {
    port.and_then(|value| value.parse::<u16>().ok())
}
