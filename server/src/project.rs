use rocket::http::Status;
use rocket::request::Outcome;
use rocket::request::{self, FromRequest, Request};
use uuid::Uuid;

#[derive(Debug)]
pub enum ProjectError {
    IdMissing,
    InvalidId,
}

#[derive(Debug, Copy, Clone)]
pub struct Project {
    pub id: Uuid,
}

#[rocket::async_trait]
impl<'a, 'r> FromRequest<'a, 'r> for Project {
    type Error = ProjectError;

    async fn from_request(req: &'a Request<'r>) -> request::Outcome<Self, Self::Error> {
        let id = match req.headers().get_one("Bento-Project") {
            None => return Outcome::Failure((Status::BadRequest, ProjectError::IdMissing)),
            Some(id) => id,
        };

        match Uuid::parse_str(id) {
            Ok(id) => Outcome::Success(Project { id }),
            Err(_) => Outcome::Failure((Status::BadRequest, ProjectError::InvalidId)),
        }
    }
}
