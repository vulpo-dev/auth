use crate::data::session::Claims;
use crate::data::{get_query, GenericClient};
use crate::response::error::ApiError;

use bcrypt;
use chrono::{DateTime, NaiveDateTime, Utc};
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use std::char;
use uuid::Uuid;

#[derive(Debug)]
pub struct Passwordless {
    pub id: Uuid,
    pub created_at: DateTime<Utc>,
    pub user_id: Option<Uuid>,
    pub email: String,
    pub token: String,
    pub is_valid: bool,
    pub project_id: Uuid,
    pub confirmed: bool,
}

impl Passwordless {
    pub fn create_token<C: GenericClient>(
        client: &mut C,
        id: Option<Uuid>,
        email: &str,
        verification_token: &str,
        project: &Uuid,
        session_id: &Uuid,
    ) -> Result<Uuid, ApiError> {
        let query = get_query("passwordless/create")?;
        let row = client.query_one(
            query,
            &[&id, &email, &verification_token, &project, &session_id],
        );

        match row {
            Err(err) => {
                println!("{:?}", err);
                Err(ApiError::InternalServerError)
            }
            Ok(result) => Ok(result.get("id")),
        }
    }

    pub fn get<C: GenericClient>(client: &mut C, id: &Uuid) -> Result<Passwordless, ApiError> {
        let query = get_query("passwordless/get")?;
        let rows = match client.query(query, &[&id]) {
            Err(err) => {
                println!("{:?}", err);
                return Err(ApiError::InternalServerError);
            }
            Ok(rows) => rows,
        };

        let row = match rows.get(0) {
            None => return Err(ApiError::NotFound),
            Some(row) => row,
        };

        Ok(Passwordless {
            id: row.get("id"),
            created_at: row.get("created_at"),
            user_id: row.get("user_id"),
            email: row.get("email"),
            token: row.get("token"),
            is_valid: row.get("is_valid"),
            project_id: row.get("project_id"),
            confirmed: row.get("confirmed"),
        })
    }

    pub fn confirm<C: GenericClient>(client: &mut C, id: &Uuid) -> Result<(), ApiError> {
        let query = get_query("passwordless/confirm")?;
        match client.query(query, &[&id]) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(_) => Ok(()),
        }
    }

    pub fn remove_all<C: GenericClient>(
        client: &mut C,
        email: &str,
        project: &Uuid,
    ) -> Result<(), ApiError> {
        let query = get_query("passwordless/delete_from_user")?;
        match client.query(query, &[&email, &project]) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(_) => Ok(()),
        }
    }

    pub fn compare(&self, token: &str) -> bool {
        match bcrypt::verify(token, &self.token) {
            Err(_) => false,
            Ok(result) => result,
        }
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

#[derive(Debug)]
pub struct Token;

impl Token {
    pub fn is_valid<C: GenericClient>(
        client: &mut C,
        claims: &Claims,
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
}
