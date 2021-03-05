import { v4 as uuid } from 'uuid'
import { Key, Keys, Sessions, Session } from 'storage'

export async function createSession(): Promise<Session> {
	let keys = await generateKeys()
	let id = uuid()

	Sessions.insert({ id })

	await Keys.set(id, { ...keys })
	return { id, ...keys }	
}

export async function getPublicKey(session: Session): Promise<Array<number>> {
	let exported = await crypto.subtle.exportKey("spki", session.publicKey)
	let exportedAsString = ab2str(exported)
	let exportedAsBase64 = window.btoa(exportedAsString)
	let pemExported = `-----BEGIN PUBLIC KEY-----${exportedAsBase64}-----END PUBLIC KEY-----`
	let enc = new TextEncoder()
	return Array.from(enc.encode(pemExported))
}

export function ratPayload() {
	let now = new Date()
	let exp = Math.ceil(now.setMinutes(now.getMinutes() + 5) / 1000)
	return {
		exp
	}
}

export async function generateAccessToken(sessionId: string, claims: Object = {}): Promise<string | null> {
	let session = await Keys.get(sessionId)

	if (!session) {
		return null
	}

	let header = isRsa(session.privateKey.algorithm.name)
		?	{
				alg: "RS256",
				typ: "JWT"
			}
		:	{
				alg: "ES384",
				typ: "JWT"
			}

	let now = new Date()
	let exp = Math.ceil(now.setMinutes(now.getMinutes() + 1) / 1000)

	let payload = {
		...claims,
		jti: uuid(),
	}

	let h = base64url(JSON.stringify(header))
	let p = base64url(JSON.stringify(payload))

	let enc = new TextEncoder()
	let encoded = enc.encode(`${h}.${p}`)

	let sign = isRsa(session.privateKey.algorithm.name)
		?	"RSASSA-PKCS1-v1_5"
		:	{
		    	name: "ECDSA",
		   		hash: {name: "SHA-384"},
		  	}

	let signature = await window.crypto.subtle.sign(
	  sign,
	  session.privateKey,
	  encoded
	)

	return `${h}.${p}.${base64url(ab2str(signature))}`
}

async function generateKeys(): Promise<CryptoKeyPair> {
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

	let keys = await window.crypto.subtle.generateKey(algo, false, ["sign", "verify"])
	return keys as CryptoKeyPair
}

function ab2str(buf: ArrayBuffer) {
  let arr = Array.from(new Uint8Array(buf))
  return String.fromCharCode(...arr)
}

function isFirefox(): boolean {
	return navigator.userAgent.toLowerCase().indexOf('firefox') > -1
}

function isRsa(name: string) {
	return name === 'RSASSA-PKCS1-v1_5'
}

function base64url(str: string) {
	return window.btoa(str).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}