import { Page } from "@playwright/test";
import { generateKeyPairSync } from 'crypto';
import { v4 as uuid } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'
import axios from 'axios'

export function generateKeyPair() {
  return generateKeyPairSync('rsa', {
    modulusLength: 2048,
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

type Session = {
	id: string;
	keys: {
		privateKey: string;
		publicKey: string;
	};
	expire_at: Date;
}

export function generateSession(): Session {
	let id = uuid()
	let keys = generateKeyPair()
	let expire_at = new Date(Date.now() - 60 * 60 * 1000)
	return {
			id,
			keys,
			expire_at,
		}
}


type SignInResult = {
	user: any;
	token: any;
	session: Session;
}


export async function signIn(baseUrl: string, project: string, email: string, password: string): Promise<SignInResult> {
	let session = generateSession()

	let payload = {
		email,
		password,
		public_key: [...Buffer.from(session.keys.publicKey)], 
		session: session.id,
		device_languages: [],
	}

	let { data: token } = await axios.post<any, any>(`${baseUrl}/password/sign_in`, payload, {
			headers: {
				'Vulpo-Project': project
			}
		})

	let { data: user } = await axios.get(`${baseUrl}/user/get`, {
				headers: {
					'Authorization': `Bearer ${token.access_token}`,
					'Vulpo-Project': project
				}
			})

	return { session, user, token }
}


type SessionState = {
	sessions: Array<SignInResult>;
	active_user: string;
	file: string;
}

export function setSessionState({ file, ...state }: SessionState) {
	let fileName = path.join(process.cwd(), file)
	fs.writeFileSync(fileName, JSON.stringify(state, null, 2))
}


export async function addSessions(page: Page, file: string = 'session.json') {
	let fileName = path.join(process.cwd(), file)
	let sessions = JSON.parse(fs.readFileSync(fileName, { encoding: 'utf-8' })) 

	await page.evaluate<void, [SessionState]>(async ([state]) => {
		let dbName = "auth-db";

		function open(): Promise<IDBDatabase> {
			return new Promise((resolve, reject) => {
				let request = indexedDB.open(dbName, 1);
				request.onsuccess = function () {
					resolve(this.result)
				}

				request.onerror = function (e) {
					reject(e)
				}

				request.onupgradeneeded = function(event: any) {
					// Save the IDBDatabase interface
					var db = event.target.result;

					// Create an objectStore for this database
					db.createObjectStore("keys");
				}
			})
		}

		function str2ab(str: string) {
		   const buf = new ArrayBuffer(str.length);
		   const bufView = new Uint8Array(buf);
		   for (let i = 0, strLen = str.length; i < strLen; i++) {
		     bufView[i] = str.charCodeAt(i);
		   }
		   return buf;
		 }

		// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey#subjectpublickeyinfo_import
		function importPublicKey(pem: string) {
	    // fetch the part of the PEM string between header and footer
	    const pemHeader = "-----BEGIN PUBLIC KEY-----";
	    const pemFooter = "-----END PUBLIC KEY-----";
	    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
	    // base64 decode the string to get the binary data
	    const binaryDerString = window.atob(pemContents);
	    // convert from a binary string to an ArrayBuffer
	    const binaryDer = str2ab(binaryDerString);

	    return window.crypto.subtle.importKey(
	      "spki",
	      binaryDer,
	      {
	        name: "RSASSA-PKCS1-v1_5",
	        hash: "SHA-256"
	      },
	      true,
	      ["verify"]
	    );
	  }

	  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey#pkcs_8_import
	  function importPrivateKey(pem: string) {
	    // fetch the part of the PEM string between header and footer
	    const pemHeader = "-----BEGIN PRIVATE KEY-----";
	    const pemFooter = "-----END PRIVATE KEY-----";
	    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
	    // base64 decode the string to get the binary data
	    const binaryDerString = window.atob(pemContents);
	    // convert from a binary string to an ArrayBuffer
	    const binaryDer = str2ab(binaryDerString);

	    return window.crypto.subtle.importKey(
	      "pkcs8",
	      binaryDer,
	      {
	        name: "RSASSA-PKCS1-v1_5",
	        hash: "SHA-256",
	      },
	      true,
	      ["sign"]
	    );
	  }


		let addKeys = async (session: Session) => {				
			let privateKey = await importPrivateKey(session.keys.privateKey.replaceAll('\n', ''))
			let publicKey = await importPublicKey(session.keys.publicKey.replaceAll('\n', ''))


			let db = await open()

			let tx = db.transaction('keys', 'readwrite');
			let os = tx.objectStore('keys');
			let req = os.add({ publicKey, privateKey }, session.id)
			return new Promise((resolve) => {
				req.onsuccess = () => resolve('')
			})
		}

		await Promise.all(
			state.sessions.map(({ session }) => addKeys(session))
		)

		localStorage.setItem(`${dbName}::active_user`, state.active_user)

		let sessions = state.sessions.map(s => {
			return {
				id: s.session.id,
				expire_at: s.session.expire_at,
				user: s.user,
			}
		})

		localStorage.setItem(`${dbName}::sessions`, JSON.stringify(sessions))
		
	}, [sessions])
}