pub mod data;
mod reset;
mod signin;
mod signup;

use crate::response::error::ApiError;
use rocket::Route;

pub fn routes() -> Vec<Route> {
    routes![
        signup::sign_up,
        signin::sign_in,
        // signin::cors,
        reset::request_password_reset,
        reset::password_reset,
        reset::verify_token,
    ]
}

const MIN: usize = 8;

/*
    Some hashing algorithms such as Bcrypt have a maximum length for
    the input, which is 72 characters for most implementations (there
    are some reports that other implementations have lower maximum lengths,
    but none have been identified at the time of writing). Where Bcrypt is
    used, a maximum length of 64 characters should be enforced on the input,...

    Link: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#maximum-password-lengths
*/
const MAX: usize = 64;

fn validate_password_length(password: &str) -> Result<(), ApiError> {
    if password.len() < MIN {
        return Err(ApiError::PasswordMinLength);
    }

    if password.len() > MAX {
        return Err(ApiError::PasswordMaxLength);
    }

    Ok(())
}
