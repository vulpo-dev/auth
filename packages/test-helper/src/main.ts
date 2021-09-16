import { Page } from "@playwright/test";
import { generateKeyPairSync } from 'crypto';
import { v4 as uuid } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'
import { SessionInfo, User } from '@riezler/auth-sdk'

let dbName = "auth-db";

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


type Session = Partial<Omit<SessionInfo, "user">> & {
	keys?: {
		privateKey: string;
		publicKey: string;
	}
}


export function generateSession(user: User, session?: Session) {
	let id = session?.id ?? uuid()
	let keys = session?.keys ?? generateKeyPair()
	let expire_at = session?.expire_at ?? new Date(Date.now() - 60 * 60 * 1000)

	let fileName = path.join(process.cwd(), 'session.json')
	fs.writeFileSync(fileName, JSON.stringify([{
			id: id,
			keys,
			expire_at,
			user,
		}])
	)
}


export async function addSession({ page }: { page: Page }) {
	let fileName = path.join(process.cwd(), 'session.json')
	let sessions = JSON.parse(fs.readFileSync(fileName, { encoding: 'utf-8' })) 

	await page.evaluate(async ([dbName, sessions]) => {
		
		function open(): Promise<IDBDatabase> {
			return new Promise((resolve) => {
				let request = indexedDB.open(dbName, 2);
				request.onsuccess = function () {
					resolve(this.result)
				}

				request.onupgradeneeded = function(event: any) {
					// Save the IDBDatabase interface
					var db = event.target.result;

					// Create an objectStore for this database
					db.createObjectStore("keys", { keyPath: "key" });
				}
			})
		}

		let db = await open()

		let tx = db.transaction('keys', 'readwrite');
		let os = tx.objectStore('keys');

		let session = sessions[0]
		let req = os.add({ key: session.id, value: session.keys })

		return new Promise((resolve) => {
			req.onsuccess = () => resolve('')
		})
	}, [dbName, sessions])
}