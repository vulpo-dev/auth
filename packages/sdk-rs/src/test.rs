use crate::{AuthKeys, Claims, Error};
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
use reqwest;
use serde::Deserialize;
use uuid::Uuid;

#[tokio::test]
async fn get_keys() {
    let keys = AuthKeys::get_keys("http://localhost:7000/keys").await;
    assert!(keys.is_ok())
}

#[tokio::test]
async fn get_keys_faild() {
    let keys = AuthKeys::get_keys("http://localhost:7000/keys?error=internal").await;
    let error = keys.unwrap_err();
    assert_eq!(error, Error::GetKeysRequest);
}

#[tokio::test]
async fn get_keys_expire_at_missing() {
    let keys = AuthKeys::get_keys("http://localhost:7000/keys?error=payload&omit=expire_at").await;
    let error = keys.unwrap_err();
    assert_eq!(error, Error::InvalidPayload);
}

#[tokio::test]
async fn get_keys_keys_missing() {
    let keys = AuthKeys::get_keys("http://localhost:7000/keys?error=payload&omit=keys").await;
    let error = keys.unwrap_err();
    assert_eq!(error, Error::InvalidPayload);
}

#[tokio::test]
async fn get_keys_fails_for_invalid_datetime() {
    let keys = AuthKeys::get_keys("http://localhost:7000/keys?datetime=utc").await;
    let error = keys.unwrap_err();
    assert_eq!(error, Error::InvalidPayload);
}

#[test]
fn get_bearer_token() {
    let token = AuthKeys::bearer_token("Bearer fuuu").unwrap();
    assert_eq!(token, "fuuu");
}

#[test]
fn get_bearer_token_fails() {
    let token = AuthKeys::bearer_token("Bearer");
    assert_eq!(token, None);
}

#[tokio::test]
async fn get_key() {
    let keypairs = get_keypairs("http://localhost:7000/keys/list")
        .await
        .unwrap();

    let auth = AuthKeys::get_keys("http://localhost:7000/keys")
        .await
        .unwrap();

    for keypair in keypairs.iter() {
        let public_key = auth.key(&keypair.id).await.unwrap();
        assert_eq!(keypair.public_key, public_key);
    }
}

#[tokio::test]
async fn get_key_expired() {
    let keypairs = get_keypairs("http://localhost:7000/keys/list")
        .await
        .unwrap();

    let expire_at = Utc::now() - Duration::hours(6);
    let url = format!("http://localhost:7000/keys?expire_at={}", expire_at);
    let auth = AuthKeys::get_keys(&url).await.unwrap();

    for keypair in keypairs.iter() {
        let public_key = auth.key(&keypair.id).await.unwrap();
        assert_eq!(keypair.public_key, public_key);
    }
}

#[tokio::test]
async fn verify_token() {
    let keypairs = get_keypairs("http://localhost:7000/keys/list")
        .await
        .unwrap();

    let auth = AuthKeys::get_keys("http://localhost:7000/keys")
        .await
        .unwrap();

    let expire_at = Utc::now() + Duration::minutes(15);
    for keypair in keypairs.iter() {
        let payload = Claims {
            iss: keypair.id,
            exp: expire_at.timestamp(),
            sub: Uuid::new_v4(),
            traits: vec![],
        };

        let token = access_token(&keypair.private_key, &payload).unwrap();
        let claims = auth.verify_token(&token).await;
        assert!(claims.is_ok());
    }
}

#[tokio::test]
async fn verify_token_fails_for_missing_key() {
    let keypairs = get_keypairs("http://localhost:7000/keys/list")
        .await
        .unwrap();

    let auth = AuthKeys::get_keys("http://localhost:7000/keys")
        .await
        .unwrap();

    let expire_at = Utc::now() + Duration::minutes(15);
    let keypair = keypairs.get(0).unwrap();

    let payload = Claims {
        iss: Uuid::new_v4(),
        exp: expire_at.timestamp(),
        sub: Uuid::new_v4(),
        traits: vec![],
    };

    let token = access_token(&keypair.private_key, &payload).unwrap();
    let claims = auth.verify_token(&token).await;
    assert_eq!(claims.unwrap_err(), Error::KeyMissing);
}

#[tokio::test]
async fn verify_token_invalid_token() {
    let keypairs = get_keypairs("http://localhost:7000/keys/list")
        .await
        .unwrap();

    let auth = AuthKeys::get_keys("http://localhost:7000/keys")
        .await
        .unwrap();

    let expire_at = Utc::now() + Duration::minutes(15);
    let keypair = keypairs.get(0).unwrap();
    let keypair2 = keypairs.get(1).unwrap();

    let payload = Claims {
        iss: keypair.id,
        exp: expire_at.timestamp(),
        sub: Uuid::new_v4(),
        traits: vec![],
    };

    let token = access_token(&keypair2.private_key, &payload).unwrap();
    let claims = auth.verify_token(&token).await;
    assert_eq!(claims.unwrap_err(), Error::InvalidClaims);
}

#[derive(Deserialize)]
struct Keypair {
    pub id: Uuid,
    pub private_key: Vec<u8>,
    pub public_key: Vec<u8>,
}

async fn get_keypairs(url: &str) -> Option<Vec<Keypair>> {
    let res = reqwest::get(url).await.ok()?;
    res.json::<Vec<Keypair>>().await.ok()
}

fn access_token(key: &[u8], payload: &Claims) -> Option<String> {
    let header = Header::new(Algorithm::RS256);
    let encoding_key = EncodingKey::from_rsa_pem(key).ok()?;
    encode(&header, &payload, &encoding_key).ok()
}
