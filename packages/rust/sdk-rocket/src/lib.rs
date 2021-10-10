use rocket::fairing::{AdHoc, Fairing};
use rocket::http::Status;
use rocket::request::Outcome;
use rocket::request::{FromRequest, Request};
use std::marker::PhantomData;
use vulpo::{AuthKeys, Authorize, Error, Token};

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

        let token = match AuthKeys::get_token(&token_string) {
            Err(_) => return Outcome::Failure((Status::BadRequest, ())),
            Ok(token) => token,
        };

        let auth = match req.rocket().state::<AuthKeys>() {
            None => return Outcome::Failure((Status::InternalServerError, ())),
            Some(auth) => auth,
        };

        let get_claims = match token {
            Token::JWT(token) => auth.verify_jwt(&token).await,
            Token::ApiKey(token) => auth.verify_api_key(&token).await,
        };

        let claims = match get_claims {
            Err(err) => {
                let status = match err {
                    Error::Expired
                    | Error::Unauthorized
                    | Error::InvalidKey
                    | Error::InvalidClaims => Status::Unauthorized,
                    Error::KeyMissing | Error::GetApiKeyRequest | Error::InvalidPayload => {
                        Status::InternalServerError
                    }
                    _ => Status::BadRequest,
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
    pub fn fairing(host: String) -> impl Fairing {
        AdHoc::on_ignite("Get PublicKeys", move |rocket| async move {
            let auth = AuthKeys::init(&host)
                .await
                .expect("Failed to load public keys");

            rocket.manage(auth)
        })
    }
}
