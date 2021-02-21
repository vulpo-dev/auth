use crate::template::Templates;

pub enum DefaultRedirect {
    Passwordless,
    PasswordReset,
}

impl ToString for DefaultRedirect {
    fn to_string(&self) -> String {
        let url = match self {
            DefaultRedirect::Passwordless => "/auth/#/signin/link/confirm",
            DefaultRedirect::PasswordReset => "/auth/#/forgot-password/set-password",
        };

        String::from(url)
    }
}

impl DefaultRedirect {
    pub fn from_template(template: Templates) -> String {
        match template {
            Templates::Passwordless => DefaultRedirect::Passwordless.to_string(),
            Templates::PasswordReset => DefaultRedirect::PasswordReset.to_string(),
            _ => String::from(""),
        }
    }
}

pub enum DefaultSubject {
    Passwordless,
    PasswordReset,
}

impl ToString for DefaultSubject {
    fn to_string(&self) -> String {
        let url = match self {
            DefaultSubject::Passwordless => "Sign In",
            DefaultSubject::PasswordReset => "Reset Password",
        };

        String::from(url)
    }
}

impl DefaultSubject {
    pub fn from_template(template: Templates) -> String {
        match template {
            Templates::Passwordless => DefaultSubject::Passwordless.to_string(),
            Templates::PasswordReset => DefaultSubject::PasswordReset.to_string(),
            _ => String::from(""),
        }
    }
}
