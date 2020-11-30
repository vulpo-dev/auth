use crate::data::user::User;
use crate::db::{get_query, AuthDb};
use crate::project::Project;
use crate::template::Template;
use crate::ApiError;
use bcrypt::{hash, DEFAULT_COST};
use reqwest;

use rocket_contrib::json::Json;
use serde::Deserialize;

use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct RequestPasswordless {
    pub email: String,
}

#[post("/", data = "<body>")]
pub async fn request_passwordless(
    conn: AuthDb,
    project: Project,
    body: Json<RequestPasswordless>,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    let email = body.email.clone();
    let user = User::get_by_email(&conn, email, project.id).await?;

    let token = get_token();
    let verification_token = hash_token(&token)?;

    let email = body.email.clone();
    let id = create_token(&conn, user.id, email, verification_token, project.id).await?;

    let base_url = "http://localhost:3000".to_string();
    let link: String = format!("{}?email={}&token={}", base_url, body.email, token);

    let content = Template::passwordless(link);

    match send_mail(content).await {
        Ok(_) => Ok(Json([id])),
        Err(_e) => Err(ApiError::InternalServerError),
    }
}

fn get_token() -> String {
    Uuid::new_v4().to_string()
}

fn hash_token(token: &String) -> Result<String, ApiError> {
    match hash(token.clone(), DEFAULT_COST) {
        Err(_) => Err(ApiError::InternalServerError),
        Ok(hashed) => Ok(hashed),
    }
}

async fn create_token(
    conn: &AuthDb,
    id: Uuid,
    email: String,
    verification_token: String,
    project: Uuid,
) -> Result<Uuid, ApiError> {
    let query = get_query("passwordless/create")?;
    let row = conn
        .run(move |c| c.query_one(query, &[&id, &email, &verification_token, &project]))
        .await;

    match row {
        Err(_) => Err(ApiError::InternalServerError),
        Ok(result) => Ok(result.get("id")),
    }
}

async fn send_mail(content: String) -> Result<(), ApiError> {
    let domain = "sandbox9db1d4d2b15446b988d2d5c4f6311a22.mailgun.org";

    let form = reqwest::multipart::Form::new()
        .text("from", format!("Michael <mailgun@{}>", domain))
        .text("to", "Michael Riezler <michaelriezler@gmail.com>")
        .text("subject", "Sign In")
        .text("html", content);

    let client = reqwest::Client::new();
    let res = client
        .post(format!("https://api.mailgun.net/v3/{}/messages", domain).as_str())
        .basic_auth(
            "api",
            Some("e616c37ed3eb295dbdfcb2233e32ca21-360a0b2c-1056e2b2"),
        )
        .multipart(form)
        .send()
        .await;

    match res {
        Err(err) => {
            println!("Mail Error: {:?}", err);
            Err(ApiError::InternalServerError)
        }
        Ok(res) => {
            let text = res.text().await;
            println!("Mail Success: {:?}", text.unwrap());
            Ok(())
        }
    }
}
