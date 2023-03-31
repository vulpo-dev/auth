pub mod data;
mod reset;
mod signin;
mod signup;

use rocket::Route;
use vulpo_auth_types::error::ApiError;

pub fn routes() -> Vec<Route> {
    routes![
        signup::sign_up_handler,
        signin::sign_in_handler,
        reset::request_password_reset_handler,
        reset::password_reset_handler,
        reset::verify_token_handler,
        reset::admin_request_password_reset_handler,
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

pub fn validate_password_length(password: &str) -> Result<(), ApiError> {
    if password.len() < MIN {
        return Err(ApiError::PasswordMinLength);
    }

    if password.len() > MAX {
        return Err(ApiError::PasswordMaxLength);
    }

    Ok(())
}
