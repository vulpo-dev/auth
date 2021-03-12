use crate::db::get_query;
use crate::response::error::ApiError;
use crate::session::data::SessionClaims;

use chrono::NaiveDateTime;
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use rocket_contrib::databases::postgres::GenericClient;
use uuid::Uuid;

#[derive(Debug)]
pub struct Token;

impl Token {
    pub fn is_valid<C: GenericClient>(
        client: &mut C,
        claims: &SessionClaims,
        session: &Uuid,
    ) -> Result<bool, ApiError> {
        let query = get_query("token/is_valid")?;

        let exp = NaiveDateTime::from_timestamp(claims.exp.into(), 0);

        match client.query_one(query, &[&claims.jti, &session, &exp]) {
            Err(err) => {
                println!("{:?}", err);
                Err(ApiError::InternalServerError)
            }
            Ok(row) => Ok(row.get("is_valid")),
        }
    }

    pub fn create() -> String {
        let mut rng = thread_rng();
        (&mut rng)
            .sample_iter(Alphanumeric)
            .take(32)
            .map(char::from)
            .collect()
    }

    pub fn hash(token: &String) -> Result<String, ApiError> {
        match bcrypt::hash(token.clone(), bcrypt::DEFAULT_COST) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(hashed) => Ok(hashed),
        }
    }

    pub fn verify(token: &str, compare: &str) -> Result<bool, ApiError> {
        match bcrypt::verify(token, compare) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(valid) => Ok(valid),
        }
    }
}
