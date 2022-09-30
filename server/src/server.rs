use std::sync::Arc;

use crate::admin;
use crate::api_key;
use crate::cache::MemoryProvider;
use crate::cache::RedisProvider;
use crate::config::{cache, Secrets};
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
use werkbank::rocket::{db, TracingFairing};

pub async fn start(figment: &Figment, port: Option<u16>, secrets: Secrets) {
    let rocket_config = Figment::from(rocket::Config::default())
        .merge(figment.clone().select("server"))
        .merge(Env::prefixed("VULPO_SERVER_").global());

    let config = match port {
        None => rocket_config,
        Some(port) => rocket_config.merge(("port", port)),
    };

    let cache_config = cache(&figment);

    let _ = rocket::custom(config)
        .attach(TracingFairing)
        .attach(CORS)
        .attach(AdHoc::on_ignite("Add Secrets", |rocket| async move {
            rocket.manage(secrets)
        }))
        .attach(AdHoc::on_ignite("Add Cache", |rocket| async move {
            if let Some(off) = cache_config.off {
                if off {
                    return rocket;
                }
            }

            if let Some(url) = cache_config.url {
                let cache = RedisProvider::new(&url);
                return rocket.manage(Arc::new(cache));
            }

            let cache = MemoryProvider::new(cache_config.cache_size);
            return rocket.manage(Arc::new(cache));
        }))
        .attach(db::create_pool(&figment))
        .mount("/", admin::redirect())
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
        .mount("/api_key", api_key::routes())
        .mount("/oauth", oauth::routes())
        .launch()
        .await;
}

pub fn get_port(port: Option<&String>) -> Option<u16> {
    port.and_then(|value| value.parse::<u16>().ok())
}
