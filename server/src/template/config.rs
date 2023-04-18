use serde;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, PartialEq, Copy, Clone)]
pub enum Templates {
    #[serde(rename = "change_email")]
    ChangeEmail,

    #[serde(rename = "confirm_email_change")]
    ConfirmEmailChange,

    #[serde(rename = "password_reset")]
    PasswordReset,

    #[serde(rename = "password_changed")]
    PasswordChanged,

    #[serde(rename = "passwordless")]
    Passwordless,

    #[serde(rename = "verify_email")]
    VerifyEmail,
}

impl Templates {
    pub fn from_string(s: &str) -> Option<Templates> {
        match s {
            "change_email" => Some(Templates::ChangeEmail),
            "password_reset" => Some(Templates::PasswordReset),
            "passwordless" => Some(Templates::Passwordless),
            "verify_email" => Some(Templates::VerifyEmail),
            "confirm_email_change" => Some(Templates::ConfirmEmailChange),
            _ => None,
        }
    }
}

impl ToString for Templates {
    fn to_string(&self) -> String {
        match self {
            Templates::ChangeEmail => String::from("change_email"),
            Templates::PasswordReset => String::from("password_reset"),
            Templates::Passwordless => String::from("passwordless"),
            Templates::VerifyEmail => String::from("verify_email"),
            Templates::PasswordChanged => String::from("password_changed"),
            Templates::ConfirmEmailChange => String::from("confirm_email_change"),
        }
    }
}

pub enum DefaultRedirect {
    Passwordless,
    PasswordReset,
    VerifyEmail,
    ChangeEmail,
    ConfirmEmailChange,
    PasswordChanged,
}

impl ToString for DefaultRedirect {
    fn to_string(&self) -> String {
        let url = match self {
            DefaultRedirect::Passwordless => "/auth/signin/link/confirm",
            DefaultRedirect::PasswordReset => "/auth/forgot-password/set-password",
            DefaultRedirect::PasswordChanged => "/auth/forgot-password",
            DefaultRedirect::VerifyEmail => "/auth/verify-email",
            DefaultRedirect::ChangeEmail => "/auth/user/change-email/reset",
            DefaultRedirect::ConfirmEmailChange => "/auth/user/change-email/confirm",
        };

        String::from(url)
    }
}

impl DefaultRedirect {
    pub fn from_template(template: Templates) -> String {
        match template {
            Templates::Passwordless => DefaultRedirect::Passwordless.to_string(),
            Templates::PasswordReset => DefaultRedirect::PasswordReset.to_string(),
            Templates::VerifyEmail => DefaultRedirect::VerifyEmail.to_string(),
            Templates::ChangeEmail => DefaultRedirect::ChangeEmail.to_string(),
            Templates::ConfirmEmailChange => DefaultRedirect::ConfirmEmailChange.to_string(),
            Templates::PasswordChanged => DefaultRedirect::PasswordChanged.to_string(),
        }
    }
}

pub enum DefaultSubject {
    Passwordless,
    PasswordReset,
    VerifyEmail,
    ChangeEmail,
    PasswordChanged,
    ConfirmEmailChange,
}

impl ToString for DefaultSubject {
    fn to_string(&self) -> String {
        let url = match self {
            DefaultSubject::Passwordless => "Sign In",
            DefaultSubject::PasswordReset => "Reset Password",
            DefaultSubject::VerifyEmail => "Verify Email",
            DefaultSubject::ChangeEmail => "Email Change Requested",
            DefaultSubject::PasswordChanged => "Password Changed",
            DefaultSubject::ConfirmEmailChange => "Confirm Email Change",
        };

        String::from(url)
    }
}

impl DefaultSubject {
    pub fn from_template(template: Templates) -> String {
        match template {
            Templates::Passwordless => DefaultSubject::Passwordless.to_string(),
            Templates::PasswordReset => DefaultSubject::PasswordReset.to_string(),
            Templates::VerifyEmail => DefaultSubject::VerifyEmail.to_string(),
            Templates::ChangeEmail => DefaultSubject::ChangeEmail.to_string(),
            Templates::PasswordChanged => DefaultSubject::PasswordChanged.to_string(),
            Templates::ConfirmEmailChange => DefaultSubject::ConfirmEmailChange.to_string(),
        }
    }
}
