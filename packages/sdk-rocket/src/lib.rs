use rocket::fairing::{AdHoc, Fairing};
use rocket::http::Status;
use rocket::request::Outcome;
use rocket::request::{FromRequest, Request};

use vulpo::{AuthKeys, Claims};

pub struct Auth(Claims);

#[rocket::async_trait]
impl<'r> FromRequest<'r> for Auth {
    type Error = ();

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let token_string = match req.headers().get_one("Authorization") {
            None => return Outcome::Failure((Status::BadRequest, ())),
            Some(token) => token,
        };

        let auth = match req.rocket().state::<AuthKeys>() {
            None => return Outcome::Failure((Status::InternalServerError, ())),
            Some(auth) => auth,
        };

        let token = AuthKeys::bearer_token(token_string);
        let claims = match auth.verify_token(&token).await {
            Err(_) => return Outcome::Failure((Status::BadRequest, ())),
            Ok(claims) => claims,
        };

        Outcome::Success(Auth(claims))
    }
}

impl Auth {
    pub fn fairing(key_url: String) -> impl Fairing {
        AdHoc::on_ignite("Get PublicKeys", move |rocket| async move {
            let auth = AuthKeys::get_keys(&key_url)
                .await
                .expect("Failed to load public auth keys");

            rocket.manage(auth)
        })
    }
}
