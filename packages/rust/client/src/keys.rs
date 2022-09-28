use ecdsa::SigningKey;
use p384::NistP384;

use pkcs8::{EncodePrivateKey, EncodePublicKey, LineEnding};
use rand_core::OsRng;

pub struct KeyPair {
    pub private_key: Vec<u8>,
    pub public_key: Vec<u8>,
}

pub fn generate_keypair() -> KeyPair {
    let signing_key: SigningKey<NistP384> = SigningKey::random(&mut OsRng);
    let verifying_key = signing_key.verifying_key();

    let signing_key_bytes = signing_key.to_pkcs8_pem(LineEnding::LF).unwrap();
    let verifying_key_bytes = verifying_key.to_public_key_pem(LineEnding::LF).unwrap();

    KeyPair {
        public_key: verifying_key_bytes.as_bytes().to_vec(),
        private_key: signing_key_bytes.as_bytes().to_vec(),
    }
}
