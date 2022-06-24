use chrono::{DateTime, Utc};
use jsonwebtoken as jwt;
use jsonwebtoken::{errors::ErrorKind, Algorithm, DecodingKey, Validation};
use reqwest;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;
use std::mem;
use std::str::FromStr;
use std::sync::Mutex;
use uuid::Uuid;

#[derive(Serialize)]
pub struct ApiKeyPayload {
    pub api_key: String,
}

pub enum Token {
    ApiKey(String),
    JWT(String),
}

pub enum TokenError {
    TokenTypeNotFound,
    TokenNotFound,
    InvalidTokenType,
}

pub trait Authorize {
    fn authorize(claims: &Claims) -> Result<bool, u16>;
}

pub struct AccessToken;

impl Authorize for AccessToken {
    fn authorize(_: &Claims) -> Result<bool, u16> {
        Ok(true)
    }
}

#[cfg(test)]
mod test;

#[derive(Debug, Deserialize, Serialize)]
pub struct Claims {
    pub sub: Uuid,
    pub exp: i64,
    pub traits: Vec<String>,
}

type Key = Vec<u8>;

#[derive(Debug, PartialEq)]
pub enum Error {
    Unauthorized,

    KeyMissing,
    InvalidKey,
    InvalidClaims,
    InvalidPayload,
    GetKeysRequest,
    InvalidTimestamp,
    Expired,

    GetApiKeyRequest,
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[derive(Debug)]
pub struct AuthKeys {
    pub keys: Mutex<HashMap<Uuid, Key>>,
    pub expire_at: Mutex<DateTime<Utc>>,
    pub host: String,
}

impl AuthKeys {
    pub async fn init(host: &str) -> Result<AuthKeys, Error> {
        let keys_url = format!("{}/keys", host);
        let keys = AuthKeys::get_keys(&keys_url).await?;
        Ok(AuthKeys {
            keys: keys.keys,
            expire_at: keys.expire_at,
            host: String::from(host),
        })
    }

    pub async fn get_keys(url: &str) -> Result<Keys, Error> {
        let res = reqwest::get(url).await.map_err(|_| Error::GetKeysRequest)?;

        let status = res.status().as_u16();

        if status >= 500 {
            return Err(Error::GetKeysRequest);
        }

        if status == 401 {
            return Err(Error::Unauthorized);
        }

        if status >= 300 {
            return Err(Error::GetApiKeyRequest);
        }

        let res = match res.json::<PublicKeys>().await {
            Err(_) => return Err(Error::InvalidPayload),
            Ok(json) => json,
        };

        let mut keys = HashMap::new();
        res.keys.iter().for_each(|key| {
            keys.insert(key.id, key.key.to_owned());
        });

        let expire_at = Mutex::new(res.expire_at);
        let keys = Mutex::new(keys);

        Ok(Keys { expire_at, keys })
    }

    pub async fn key(&self, id: &Uuid) -> Option<Key> {
        let expired = match self.expire_at.lock() {
            Err(_) => return None,
            Ok(exp) => *exp >= Utc::now(),
        };

        if expired {
            let keys_url = format!("{}/keys", self.host);
            let new_keys = AuthKeys::get_keys(&keys_url).await.unwrap();

            let mut exp = self.expire_at.lock().unwrap();
            let _ = mem::replace(&mut exp, new_keys.expire_at.lock().unwrap());

            let mut keys = self.keys.lock().unwrap();
            keys.clear();
            new_keys
                .keys
                .lock()
                .unwrap()
                .iter()
                .for_each(|(id, entry)| {
                    keys.insert(*id, entry.to_vec());
                });
        }

        let keys = match self.keys.lock() {
            Err(_) => return None,
            Ok(keys) => keys,
        };

        match keys.get(&id) {
            None => None,
            Some(key) => Some(key.to_vec()),
        }
    }

    pub fn bearer_token(value: &str) -> Option<String> {
        let end = value.len();
        let start = "Bearer ".len();

        if start > end {
            return None;
        }

        Some(value[start..end].to_string())
    }

    pub fn get_token(token: &str) -> Result<Token, TokenError> {
        let mut token_stream = token.split_whitespace().map(|part| part.trim());

        let token_type = token_stream
            .next()
            .ok_or_else(|| TokenError::TokenNotFound)?;

        let token = token_stream
            .next()
            .ok_or_else(|| TokenError::TokenTypeNotFound)?
            .to_string();

        match token_type.to_lowercase().as_str() {
            "bearer" => Ok(Token::JWT(token)),
            "apikey" => Ok(Token::ApiKey(token)),
            _ => Err(TokenError::InvalidTokenType),
        }
    }

    fn decode_header(token: &String) -> Result<jwt::Header, Error> {
        jwt::decode_header(&token).map_err(|err| match err.into_kind() {
            ErrorKind::ExpiredSignature => Error::Expired,
            _ => Error::InvalidClaims,
        })
    }

    pub async fn verify_jwt(&self, token: &String) -> Result<Claims, Error> {
        let header = AuthKeys::decode_header(&token)?;

        let kid = header
            .kid
            .and_then(|kid| Uuid::from_str(&kid).ok())
            .ok_or(Error::InvalidClaims)?;

        let key = match self.key(&kid).await {
            None => return Err(Error::KeyMissing),
            Some(key) => key,
        };

        let decoding_key = match DecodingKey::from_rsa_pem(&key) {
            Err(_) => return Err(Error::InvalidKey),
            Ok(dk) => dk,
        };

        match jwt::decode::<Claims>(&token, &decoding_key, &Validation::new(Algorithm::RS256)) {
            Err(err) => match err.into_kind() {
                ErrorKind::ExpiredSignature => Err(Error::Expired),
                _ => Err(Error::InvalidClaims),
            },
            Ok(td) => Ok(td.claims),
        }
    }

    pub async fn verify_api_key(&self, token: &String) -> Result<Claims, Error> {
        let url = format!("{}/api_key/verify", self.host);

        let payload = ApiKeyPayload {
            api_key: token.to_string(),
        };

        let client = reqwest::Client::new();
        let res = match client.post(url).json(&payload).send().await {
            Err(_) => return Err(Error::GetApiKeyRequest),
            Ok(res) => res,
        };

        if res.status() == 401 {
            return Err(Error::Unauthorized);
        }

        if res.status().as_u16() >= 300 {
            return Err(Error::GetApiKeyRequest);
        }

        let res = match res.json::<Claims>().await {
            Err(_) => return Err(Error::InvalidPayload),
            Ok(json) => json,
        };

        Ok(res)
    }
}

#[derive(Deserialize)]
pub struct PublicKeys {
    pub expire_at: DateTime<Utc>,
    pub keys: Vec<PublicKey>,
}

#[derive(Deserialize)]
pub struct PublicKey {
    pub id: Uuid,
    pub key: Vec<u8>,
}

#[derive(Debug)]
pub struct Keys {
    pub keys: Mutex<HashMap<Uuid, Key>>,
    pub expire_at: Mutex<DateTime<Utc>>,
}
