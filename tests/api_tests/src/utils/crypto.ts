import { generateKeyPairSync } from 'crypto';


export function generateKeyPair() {
  return generateKeyPairSync('ec', {
    namedCurve: 'secp384r1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    }
  })
}
