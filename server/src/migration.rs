use figment::Figment;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use std::str::FromStr;
use werkbank::migration::create_db;
use werkbank::rocket::db::get_db_config;

pub async fn run(config: &Figment) {
    let config = get_db_config(&config);
    let url = config.database_url.expect("database url");

    create_db(&url).await;

    let options = PgConnectOptions::from_str(&url)
        .expect("valid db connection string")
        .to_owned();

    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect_with(options)
        .await
        .expect("Failed to connect");

    match sqlx::migrate!().run(&pool).await {
        Ok(_) => println!("Migrations done"),
        Err(err) => {
            println!("Failed to run migrations");
            panic!("{:?}", err);
        }
    };
}
