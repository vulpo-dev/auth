import { Session, Key } from './storage'

export async function getPublicKey(session: Session): Promise<Array<number>> {
	let exported = await crypto.subtle.exportKey("spki", session.publicKey)
	let exportedAsString = ab2str(exported)
	let exportedAsBase64 = globalThis.btoa(exportedAsString)
	let pemExported = `-----BEGIN PUBLIC KEY-----${exportedAsBase64}-----END PUBLIC KEY-----`
	let enc = new TextEncoder()
	return Array.from(enc.encode(pemExported))
}

// rat := Refresh Access Token
export function ratPayload() {
	let now = new Date()
	let exp = Math.ceil(now.setMinutes(now.getMinutes() + 5) / 1000)
	return {
		exp
	}
}

export async function generateKeys(extractable = false): Promise<Key> {
	// https://bugzilla.mozilla.org/show_bug.cgi?id=1133698
	let algo = isFirefox()
		? 	{
			    name: "RSASSA-PKCS1-v1_5",
			    modulusLength: 2048,
			    publicExponent: new Uint8Array([1, 0, 1]),
			    hash: "SHA-256",
			}
		: 	{
			  name: "ECDSA",
			  namedCurve: "P-384"
			}

	let keys = await globalThis.crypto
		.subtle
		.generateKey(algo, extractable, ["sign", "verify"])

	return keys as Key
}

export function ab2str(buf: ArrayBuffer): string {
  let arr = Array.from(new Uint8Array(buf))
  return String.fromCharCode(...arr)
}

export function isFirefox(): boolean {
	return navigator
		.userAgent
		.toLowerCase()
		.indexOf('firefox') > -1
}

export function isRsa(name: string): boolean {
	return name === 'RSASSA-PKCS1-v1_5'
}

export function base64url(str: string): string {
	return globalThis
		.btoa(str)
		.replaceAll('+', '-')
		.replaceAll('/', '_')
		.replace(/=+$/, '')
}