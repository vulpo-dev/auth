extern crate clap;
extern crate vulpo_auth_client;
extern crate vulpo_auth_client_clap;

use clap::Command;

use vulpo_auth_client::AuthClient;
use vulpo_auth_client_clap::{is_auth, run_auth};

#[tokio::main]
async fn main() {
    let app = Command::new("Example Sign In")
        .subcommand(vulpo_auth_client_clap::auth())
        .get_matches();

    let auth = AuthClient::new(
        "f4db2736-ce01-40d7-9a3b-94e5d2a648c8",
        "http://localhost:8000",
    );

    if let Some(args) = is_auth(&app) {
        match run_auth(&auth, &args).await {
            Ok(_) => println!("Auth Success"),
            Err(err) => println!("Auth Failed: {:#?}", err),
        }
    }
}
