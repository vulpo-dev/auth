use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize, Serialize, Debug)]
pub struct GenerateApiKeyPayload {
    pub expire_at: Option<DateTime<Utc>>,
    pub name: Option<String>,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ApiKeyResponse {
    pub api_key: String,
    pub id: Uuid,
}
