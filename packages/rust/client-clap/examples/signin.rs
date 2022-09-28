extern crate clap;
extern crate vulpo_auth_client;
extern crate vulpo_auth_client_clap;

use clap::Command;

use vulpo_auth_client::AuthClient;

#[tokio::main]
async fn main() {
    let app = Command::new("Example Sign In")
        .subcommand(vulpo_auth_client_clap::auth())
        .get_matches();

    let auth = AuthClient::new(
        "f4db2736-ce01-40d7-9a3b-94e5d2a648c8",
        "http://localhost:8000",
    );

    match app.subcommand() {
        Some(("auth", args)) => match args.subcommand() {
            Some(("login", args)) => {
                let email = args.get_one::<String>("email").unwrap();
                let password = args.get_one::<String>("password").unwrap();
                let res = auth.sign_in(email, password).await;
                println!("{:?}", res);
            }

            _ => println!("Invalid command"),
        },
        _ => println!("Invalid command"),
    }
}
