use uuid::Uuid;
use sqlx::PgPool;

use crate::response::error::ApiError;




#[derive(sqlx::Type)]
#[sqlx(type_name = "email_change_state")]
#[sqlx(rename_all = "lowercase")]
pub enum EmailChangeState {
	Request,
	Reject,
	Accept,
	Reset,
}


pub struct NewChangeRequest {
	pub old_email: String,
	pub new_email: String,
	pub user_id: Uuid,
	pub token: String,
	pub reset_token: String,
}


pub struct EmailChangeRequest;

impl EmailChangeRequest {
	pub async fn create(pool: &PgPool, request: &NewChangeRequest) -> Result<Uuid, ApiError> {
		sqlx::query_file!("src/user/sql/email/insert_change_request.sql", 
			request.old_email,
			request.new_email,
			request.user_id,
			request.token,
			request.reset_token,
		)
		.fetch_one(pool)
		.await
		.map(|row| row.id)
		.map_err(|_| ApiError::InternalServerError)
	}
}