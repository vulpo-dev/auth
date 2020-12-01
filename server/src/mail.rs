use crate::response::error::ApiError;

use reqwest;

#[derive(Debug)]
pub struct Email;

impl Email {
    pub async fn send(content: String) -> Result<(), ApiError> {
        let domain = "sandbox9db1d4d2b15446b988d2d5c4f6311a22.mailgun.org";

        let form = reqwest::multipart::Form::new()
            .text("from", format!("Michael <mailgun@{}>", domain))
            .text("to", "Michael Riezler <michaelriezler@gmail.com>")
            .text("subject", "Sign In")
            .text("html", content);

        let client = reqwest::Client::new();
        let res = client
            .post(format!("https://api.mailgun.net/v3/{}/messages", domain).as_str())
            .basic_auth(
                "api",
                Some("e616c37ed3eb295dbdfcb2233e32ca21-360a0b2c-1056e2b2"),
            )
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
