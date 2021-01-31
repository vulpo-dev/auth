use crate::mail::Email;
use crate::response::error::ApiError;

use reqwest;

#[derive(Debug)]
pub struct MailgunSettings {
    pub domain: String,
    pub from_name: String,
    pub from_email: String,
    pub api_key: String,
    pub username: String,
}

#[derive(Debug)]
pub struct Mailgun;

impl Mailgun {
    pub async fn send(settings: MailgunSettings, email: Email) -> Result<(), ApiError> {
        let from = format!("{} <{}>", settings.from_name, settings.from_email);

        let form = reqwest::multipart::Form::new()
            .text("from", from)
            .text("to", email.to_email)
            .text("subject", email.subject)
            .text("html", email.content);

        let client = reqwest::Client::new();
        let res = client
            .post(format!("https://api.mailgun.net/v3/{}/messages", settings.domain).as_str())
            .basic_auth(settings.username, Some(settings.api_key))
            .multipart(form)
            .send()
            .await;

        match res {
            Err(err) => {
                println!("Mail Error: {:?}", err);
                Err(ApiError::InternalServerError)
            }
            Ok(res) => {
                let text = res.text().await;
                println!("Mail Success: {:?}", text.unwrap());
                Ok(())
            }
        }
    }
}
