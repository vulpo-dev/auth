use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use vulpo_auth_types::error::ApiError;

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
        bcrypt::hash(token.clone(), bcrypt::DEFAULT_COST).map_err(|_| ApiError::InternalServerError)
    }

    pub fn verify(value: &str, hash: &str) -> Result<bool, ApiError> {
        bcrypt::verify(value, hash).map_err(|_| ApiError::InternalServerError)
    }
}
