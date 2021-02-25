use crate::template::Templates;

pub enum DefaultRedirect {
    Passwordless,
    PasswordReset,
    VerifyEmail,
    ChangeEmail,
}

impl ToString for DefaultRedirect {
    fn to_string(&self) -> String {
        let url = match self {
            DefaultRedirect::Passwordless => "/auth/#/signin/link/confirm",
            DefaultRedirect::PasswordReset => "/auth/#/forgot-password/set-password",
            DefaultRedirect::VerifyEmail => "/auth/#/verify-email",
            DefaultRedirect::ChangeEmail => "/auth/#/change-email",
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
            _ => String::from(""),
        }
    }
}

pub enum DefaultSubject {
    Passwordless,
    PasswordReset,
    VerifyEmail,
    ChangeEmail,
}

impl ToString for DefaultSubject {
    fn to_string(&self) -> String {
        let url = match self {
            DefaultSubject::Passwordless => "Sign In",
            DefaultSubject::PasswordReset => "Reset Password",
            DefaultSubject::VerifyEmail => "Verify Email",
            DefaultSubject::ChangeEmail => "Change Email",
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
            _ => String::from(""),
        }
    }
}
