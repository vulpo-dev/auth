use crate::{
    admin::{create_admin, create_admin_project, data::NewAdmin},
    config::{admin, secrets, Secrets},
};

use figment::Figment;
use rpassword;
use spinners::{Spinner, Spinners};
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use std::str::FromStr;
use text_io::read;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::db::get_db_config;

pub async fn init(figment: &Figment) -> Result<(), ApiError> {
    let config = get_db_config(&figment);
    let url = config.database_url.expect("database url");

    let Secrets { passphrase } = secrets(&figment);

    let options = PgConnectOptions::from_str(&url)
        .expect("valid db connection string")
        .to_owned();

    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect_with(options)
        .await
        .expect("Failed to connect");

    let admin_user = admin(&figment);

    if let Some(project) = admin_user {
        let project_id = create_admin_project(&pool, &project.host, &passphrase).await?;

        let admin_user = NewAdmin {
            email: project.email.to_lowercase().trim().to_string(),
            password: project.password,
        };

        create_admin(&pool, admin_user, &project_id).await?;
        return Ok(());
    }

    println!("Create Admin Project");
    println!("Add the host where the admin dashboard will run. e.g. http://admin.example.com");
    print!("Host: ");
    let host: String = read!("{}\n");
    let host = host.to_lowercase().trim().to_string();
    let mut sp = Spinner::new(Spinners::SimpleDots, "".into());
    let project_id = create_admin_project(&pool, &host, &passphrase).await?;
    sp.stop_with_newline();

    println!("Create Admin User");
    print!("Email: ");
    let email: String = read!("{}\n");
    let email = email.to_lowercase().trim().to_string();
    let password = rpassword::prompt_password("Password: ").expect("Failed to get password");
    let admin_user = NewAdmin { email, password };
    let mut sp = Spinner::new(Spinners::SimpleDots, "".into());
    create_admin(&pool, admin_user, &project_id).await?;
    sp.stop_with_newline();

    Ok(())
}
