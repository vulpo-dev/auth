use crate::response::error::ApiError;
use crate::settings::data::EmailSettings;

use lettre::{
    transport::smtp::authentication::Credentials, AsyncSmtpTransport, Message, Tokio02Connector,
    Tokio02Transport,
};

#[derive(Debug)]
pub struct Email {
    pub content: String,
    pub subject: String,
    pub to_email: String,
}

impl Email {
    pub async fn send(self, settings: EmailSettings) -> Result<(), ApiError> {
        let from = format!("{} <{}>", settings.from_name, settings.from_email);

        let email = Message::builder()
            .from(from.parse().unwrap())
            .to(self.to_email.parse().unwrap())
            .subject(self.subject)
            .body(self.content)
            .unwrap();

        let creds = Credentials::new(settings.username, settings.password);

        // Open a remote connection to gmail
        let mailer = AsyncSmtpTransport::<Tokio02Connector>::relay(&settings.host)
            .unwrap()
            .credentials(creds)
            .port(settings.port)
            .build();

        let res = mailer.send(email).await;

        match res {
            Err(err) => {
                println!("{:?}", err);
                Err(ApiError::InternalServerError)
            }

            Ok(_) => {
                println!("Mail SEND");
                Ok(())
            }
        }
    }
}
