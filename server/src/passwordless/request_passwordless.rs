use crate::db::{get_query, AuthDb};
use crate::project::Project;
use bcrypt::{hash, DEFAULT_COST};
use rocket::http::Status;
use rocket_contrib::databases::postgres::Row;
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
) -> Result<Json<[Uuid; 1]>, Status> {
    let email = body.email.clone();
    let user = get_user(&conn, email, project.id).await?;

    let token = get_token();
    let verification_token = hash_token(&token)?;

    let id: Uuid = user.get("id");
    let email = body.email.clone();
    let id = create_token(&conn, id, email, verification_token, project.id).await?;

    let base_url = "http://localhost:3000".to_string();
    let link = println!("{}?email={}&token={}", base_url, body.email, token);

    println!("Link: {:?}", link);

    Ok(Json([id]))
}

fn get_token() -> String {
    Uuid::new_v4().to_string()
}

fn hash_token(token: &String) -> Result<String, Status> {
    match hash(token.clone(), DEFAULT_COST) {
        Err(_) => Err(Status::InternalServerError),
        Ok(hashed) => Ok(hashed),
    }
}

async fn get_user(conn: &AuthDb, email: String, project: Uuid) -> Result<Row, Status> {
    let query = get_query("user/get_by_email")?;

    let row = conn
        .run(move |c| c.query_one(query, &[&email, &project]))
        .await;

    match row {
        Err(_) => Err(Status::NotFound),
        Ok(user) => Ok(user),
    }
}

async fn create_token(
    conn: &AuthDb,
    id: Uuid,
    email: String,
    verification_token: String,
    project: Uuid,
) -> Result<Uuid, Status> {
    let query = get_query("passwordless/create")?;
    let row = conn
        .run(move |c| c.query_one(query, &[&id, &email, &verification_token, &project]))
        .await;

    match row {
        Err(_) => Err(Status::InternalServerError),
        Ok(result) => Ok(result.get("id")),
    }
}
