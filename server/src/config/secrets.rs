use figment::{
    providers::{Env, Format, Toml},
    Figment,
};
use rocket;
use rocket::fairing::{Fairing, Info, Kind};
use rocket::Rocket;
use serde::{Deserialize, Serialize};

/*
 * TODO: figure out lifetime issue when using
 * Secrets as managed State in order to use
 * move that Secrets into a request guard
*/
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct Secrets {
    pub passphrase: String,
}

impl Secrets {
    pub fn get_passphrase() -> Option<String> {
        let figment = Figment::from(Toml::file("Rocket.toml").nested())
            .merge(Env::prefixed("AUTH_").global());

        match figment.extract_inner::<Self>("secrets") {
            Err(_) => None,
            Ok(secrets) => Some(secrets.passphrase),
        }
    }

    pub fn key() -> &'static str {
        "secrets"
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct SecretConfig;

#[rocket::async_trait]
impl Fairing for SecretConfig {
    fn info(&self) -> Info {
        Info {
            name: "App Secrets",
            kind: Kind::Attach,
        }
    }

    async fn on_attach(&self, rocket: Rocket) -> Result<Rocket, Rocket> {
        let figment = rocket.figment();

        let secrets = match figment.extract_inner::<Secrets>(Secrets::key()) {
            Err(err) => {
                panic!("{:?}", err);
            }

            Ok(secrets) => {
                if secrets.passphrase.len() < 8 {
                    panic!("Passphrase too short");
                }

                secrets
            }
        };

        let rocket = rocket.manage(secrets);
        Ok(rocket)
    }
}
