pub mod data;

use crate::response::error::ApiError;
use crate::settings::data::EmailSettings;

use lettre::{
    message::{header, MultiPart, SinglePart},
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
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
            .multipart(
                MultiPart::alternative().singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_HTML)
                        .body(String::from(self.content)),
                ),
            )
            .unwrap();

        let creds = Credentials::new(settings.username, settings.password);

        let mailer = if settings.host.trim() == "localhost" {
            AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous("localhost")
        } else {
            AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&settings.host).unwrap()
        };

        let mailer: AsyncSmtpTransport<Tokio1Executor> =
            mailer.credentials(creds).port(settings.port).build();

        let res = mailer.send(email).await;

        match res {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(_) => Ok(()),
        }
    }
}
