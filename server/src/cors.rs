use crate::db::Db;
use crate::project::data::Project;

use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::Status;
use rocket::http::{ContentType, Header, Method};
use rocket::request::FromRequest;
use rocket::{Request, Response};
use std::io::Cursor;
use uuid::Uuid;

pub struct CORS();

#[rocket::async_trait]
impl Fairing for CORS {
    fn info(&self) -> Info {
        Info {
            name: "Add CORS headers to requests",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        let project = request
            .headers()
            .get_one("Vulpo-Project")
            .and_then(|id| Uuid::parse_str(id).ok());

        match project {
            None => {
                response.set_header(Header::new("Access-Control-Allow-Origin", "*"));
            }
            Some(id) => {
                if let Some(db) = Db::from_request(request).await.succeeded() {
                    let row = Project::domain(&db, &id).await;
                    if let Ok(domain) = row {
                        response.set_header(Header::new("Access-Control-Allow-Origin", domain));
                    }
                }
            }
        };

        response.set_header(Header::new(
            "Access-Control-Allow-Methods",
            "POST, GET, OPTIONS",
        ));
        response.set_header(Header::new(
            "Access-Control-Allow-Headers",
            "Content-Type, Vulpo-Project, Authorization",
        ));
        response.set_header(Header::new("Access-Control-Allow-Credentials", "false"));

        if request.method() == Method::Options {
            response.set_header(ContentType::Plain);
            response.set_sized_body(0, Cursor::new(""));
            response.set_status(Status::new(200));
        }
    }
}
