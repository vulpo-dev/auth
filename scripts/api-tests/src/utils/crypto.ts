import { generateKeyPairSync } from 'crypto';


export function generateKeyPair() {
  let k = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: 'top secret'
    }
  })

  return {
    publicKey: Array.from(Buffer.from(k.publicKey)),
    privateKey: Array.from(Buffer.from(k.privateKey)),
  }
}
