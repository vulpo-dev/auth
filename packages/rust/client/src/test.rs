use crate::AuthClient;
use uuid::Uuid;

const BASE_URL: &'static str = "http://localhost:8080";

#[tokio::test]
async fn can_sign_in() {
    let project_id = Uuid::new_v4().to_string();
    let auth = AuthClient::new(&project_id, BASE_URL);
    let res = auth.sign_in("ok", "password").await;
    assert!(res.is_ok());
}

#[tokio::test]
async fn can_handle_internal_error() {
    let project_id = Uuid::new_v4().to_string();
    let auth = AuthClient::new(&project_id, BASE_URL);
    let res = auth.sign_in("internal_error", "password").await;
    assert!(res.is_err());
}
