extern crate vulpo_auth_client;

use chrono::Utc;
use uuid::Uuid;
use vulpo_auth_client::{AuthClient, GenerateApiKey};

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

    println!("Generate API Key");
    match auth.generate_api_key(None).await {
        Ok(api_key) => println!("API Key: {:#?}", api_key),
        Err(err) => panic!("Failed to generate api key: {:#?}", err),
    };

    let payload = GenerateApiKey {
        name: Some(Uuid::new_v4().to_string()),
        expire_at: Some(Utc::now()),
    };

    println!("Generate API Key with Args");
    match auth.generate_api_key(Some(payload)).await {
        Ok(api_key) => println!("API Key: {:#?}", api_key),
        Err(err) => panic!("Failed to generate api key: {:#?}", err),
    };
}
