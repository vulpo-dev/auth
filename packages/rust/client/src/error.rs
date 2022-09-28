use reqwest;
use serde_json;
use thiserror::Error;
use vulpo_auth_types::error::ApiError;

pub type Result<T> = std::result::Result<T, VulpoError>;

#[derive(Error, Debug)]
pub enum VulpoError {
    #[error("Failed to get access token")]
    GetAccessToken,

    #[error("Session not found")]
    SessionNotFound,

    #[error("faild to generate refresh access token")]
    RefreshAccessToken,

    #[error(transparent)]
    ApiError(#[from] ApiError),

    #[error(transparent)]
    Request(#[from] reqwest::Error),

    #[error(transparent)]
    Serde(#[from] serde_json::Error),

    #[error(transparent)]
    IO(#[from] std::io::Error),
}
