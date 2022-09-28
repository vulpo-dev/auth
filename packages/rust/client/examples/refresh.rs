extern crate vulpo_auth_client;

use vulpo_auth_client::AuthClient;

#[tokio::main]
async fn main() {
    let auth = AuthClient::new(
        "f4db2736-ce01-40d7-9a3b-94e5d2a648c8",
        "http://localhost:8000",
    );

    match auth.sign_in("michael@riezler.co", "password").await {
        Ok(user) => println!("Sign In success: {}", user.email),
        Err(err) => panic!("Failed to sign in: {:#?}", err),
    };

    println!("Get access token");
    match auth.get_token().await {
        Ok(at) => println!("Access Token: {:?}", at),
        Err(err) => panic!("Failed to get access token: {:#?}", err),
    };

    println!("Refresh access token");
    match auth.force_token().await {
        Ok(at) => println!("Refresh Access Token: {:?}", at),
        Err(err) => panic!("Failed to refresh access token: {:#?}", err),
    };
}
