use crate::response::error::ApiError;
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};

#[derive(Debug)]
pub struct Token;

impl Token {
    pub fn create() -> String {
        let mut rng = thread_rng();
        (&mut rng)
            .sample_iter(Alphanumeric)
            .take(64)
            .map(char::from)
            .collect()
    }

    pub fn hash(token: &str) -> Result<String, ApiError> {
        match bcrypt::hash(token.clone(), bcrypt::DEFAULT_COST) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(hashed) => Ok(hashed),
        }
    }

    pub fn verify(hashed_token: &str, raw_value: &str) -> Result<bool, ApiError> {
        match bcrypt::verify(hashed_token, raw_value) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(valid) => Ok(valid),
        }
    }
}
