use crate::mail::mailgun::{Mailgun, MailgunSettings};
use crate::response::error::ApiError;
use crate::settings::data::EmailSettings;

mod mailgun;

#[derive(Debug)]
pub struct Email {
    pub content: String,
    pub subject: String,
    pub to_email: String,
}

impl Email {
    pub async fn send(self, settings: EmailSettings) -> Result<(), ApiError> {
        match settings {
            EmailSettings::MailGun {
                domain,
                from_name,
                from_email,
                api_key,
                username,
            } => {
                let settings = MailgunSettings {
                    domain,
                    from_name,
                    from_email,
                    api_key,
                    username,
                };
                Mailgun::send(settings, self).await
            }
            EmailSettings::None => Err(ApiError::InternalServerError),
        }
    }
}
