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
            .take(32)
            .map(char::from)
            .collect()
    }

    pub fn hash(token: &str) -> Result<String, ApiError> {
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
