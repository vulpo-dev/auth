use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx;
use uuid::Uuid;

pub mod api_key;
pub mod error;
pub mod session;

#[derive(Deserialize, Serialize)]
pub struct SignInPayload {
    pub email: String,
    pub password: String,
    pub session: Uuid,
    pub public_key: Vec<u8>,
}

#[derive(sqlx::Type, PartialEq, Debug, Clone, Deserialize, Serialize)]
#[sqlx(type_name = "user_state")]
#[sqlx(rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum UserState {
    Active,
    Disabled,
    SetPassword,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct User {
    pub id: Uuid,
    pub display_name: Option<String>,
    pub email: String,
    pub email_verified: bool,
    pub photo_url: Option<String>,
    pub traits: Vec<String>,
    pub data: serde_json::value::Value,
    pub provider_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub state: UserState,
    pub device_languages: Vec<String>,
}
