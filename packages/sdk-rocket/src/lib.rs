use rocket::fairing::{AdHoc, Fairing};
use rocket::http::Status;
use rocket::request::Outcome;
use rocket::request::{FromRequest, Request};
use std::marker::PhantomData;
use vulpo::{AuthKeys, Authorize, Error};

pub use vulpo::Claims;

pub struct Auth<C: Authorize>(Claims, PhantomData<C>);

impl<C: Authorize> Auth<C> {
    pub fn inner(self) -> Claims {
        self.0
    }
}

#[rocket::async_trait]
impl<'r, C> FromRequest<'r> for Auth<C>
where
    C: Authorize + Send + Sync,
{
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

        let token = match AuthKeys::bearer_token(token_string) {
            None => return Outcome::Failure((Status::BadRequest, ())),
            Some(t) => t,
        };

        let claims = match auth.verify_token(&token).await {
            Err(err) => {
                let status = if err == Error::Expired {
                    Status::Unauthorized
                } else {
                    Status::BadRequest
                };
                return Outcome::Failure((status, ()));
            }
            Ok(claims) => claims,
        };

        let next = match C::authorize(&claims) {
            Err(code) => return Outcome::Failure((Status::new(code), ())),
            Ok(next) => next,
        };

        if next == false {
            return Outcome::Failure((Status::Forbidden, ()));
        }

        Outcome::Success(Auth(claims, PhantomData))
    }
}

pub struct AuthClient;

impl AuthClient {
    pub fn fairing(key_url: String) -> impl Fairing {
        AdHoc::on_ignite("Get PublicKeys", move |rocket| async move {
            let auth = AuthKeys::get_keys(&key_url)
                .await
                .expect("Failed to load public keys");

            rocket.manage(auth)
        })
    }
}
