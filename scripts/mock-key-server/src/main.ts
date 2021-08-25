import express, { Response, Request } from 'express'
import { Key } from '../../../admin/node_modules/@riezler/auth-sdk/lib/storage'
import { generateKeyPairSync } from 'crypto'
import { v4 as uuid } from 'uuid'

let app = express()

type Keypair = {
	id: string;
	private_key: Array<number>;
	public_key: Array<number>;
}

function generateKeypair(): Keypair {
	let { privateKey, publicKey } = generateKeyPairSync('rsa', {
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
	return {
		id: uuid(),
		private_key: Array.from(Buffer.from(privateKey, 'utf8')),
		public_key: Array.from(Buffer.from(publicKey, 'utf8')),
	}
}

let KEYS = Array.from({ length: 10 }, () => generateKeypair())

app.get('/keys/list', (_, res) => {
	res.json(KEYS)
})


type PublicKey = {
	id: string;
	key: Array<number>;
}

type PublicKeys = {
	expire_at: string;
	keys: Array<PublicKey>
}

type Params = {
	expire_at?: string;
	datetime?: 'utc' | 'iso';
	error?: string;
	delay?: string;
	omit?: string;
}

app.get("/keys", async (
	req: Request,
	res: Response
) => {

	let query = req.query as Params
	let error = query.error ?? ''
	let expire_at = getExpire(query.expire_at, query.datetime === 'utc')

	await wait(query.delay)

	if (error === 'internal') {
		return res
			.status(500)
			.json({ code: 'internal_error' })
	}

	let keys = KEYS.map(key => {
		return {
			id: key.id,
			key: key.public_key,
		}
	})

	let payload: PublicKeys = {
		expire_at,
		keys,
	}

	if (error === 'payload') {
		let prop = query.omit
		if (prop) {
			delete payload[prop]
		}
		console.log(payload)
	}

	res.json(payload)
})

app.listen(7000, () => {
	console.log('Server is running on port: 7000')
	console.log(`ENDPOINTS:
    GET /keys/list
        will return a list of Keypairs

    GET /keys
    	returns the public keys 
	`)
})

function getExpire(expire_at: string = '', utc: boolean): string {

	if (expire_at !== '') {
		return expire_at
	}

	let hour = 60 * 60 * 1000
	let date = new Date(Date.now() + 6 * hour)
	return utc
		? date.toUTCString()
		: date.toISOString()
}

async function wait(seconds?: string) {
	let delay = parseInt(seconds ?? '', 10)

	if (isNaN(delay)) {
		return
	}

	return new Promise((resolve) => {
		setTimeout(resolve, delay)
	})
}