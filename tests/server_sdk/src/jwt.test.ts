import axios from 'axios'
import { v4 as uuid } from 'uuid'
import jwt from 'jsonwebtoken'
import { Claims } from './types'

let minute = 60 * 1000

describe("JWT", () => {
	test("returns ok", async () => {
		let keys = await getKeys()
		let sink = keys.map(async key => {
			let claims: Claims = {
				sub: uuid(),
				exp: Date.now() + 15 * minute,
				iss: key.id,
				traits: [],
			}

			let token = generateAccessToken(claims, Buffer.from(key.private_key))
			let config = {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			}

			let res = await axios
				.get('http://localhost:8000', config)
				.catch(err => err.response)

			return res.status
		})


		let result = await Promise.all(sink)
		expect(result.every(status => status === 200)).toBe(true)
	})


	test("returns 500", async () => {
		let keys = await getKeys()
		let sink = keys.map(async key => {
			let claims: Claims = {
				sub: uuid(),
				exp: Date.now() + 15 * minute,
				iss: key.id,
				traits: [],
			}

			let token = generateAccessToken(claims, Buffer.from(key.private_key))
			let config = {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			}

			let res = await axios
				.get('http://localhost:8000/error', config)
				.catch(err => err.response)

			return res.status
		})


		let result = await Promise.all(sink)
		expect(result.every(status => status === 500)).toBe(true)
	})


	test("returns forbidden", async () => {
		let keys = await getKeys()
		let sink = keys.map(async key => {
			let claims: Claims = {
				sub: uuid(),
				exp: Date.now() + 15 * minute,
				iss: key.id,
				traits: [],
			}

			let token = generateAccessToken(claims, Buffer.from(key.private_key))
			let config = {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			}

			let res = await axios
				.get('http://localhost:8000/admin', config)
				.catch(err => err.response)

			return res.status
		})


		let result = await Promise.all(sink)
		expect(result.every(status => status === 403)).toBe(true)
	})

	test("returns ok for admin", async () => {
		let keys = await getKeys()
		let sink = keys.map(async key => {
			let claims: Claims = {
				sub: uuid(),
				exp: Date.now() + 15 * minute,
				iss: key.id,
				traits: ['admin'],
			}

			let token = generateAccessToken(claims, Buffer.from(key.private_key))
			let config = {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			}

			let res = await axios
				.get('http://localhost:8000/admin', config)
				.catch(err => err.response)

			return res.status
		})


		let result = await Promise.all(sink)
		expect(result.every(status => status === 200)).toBe(true)
	})

	test("fails when header is missing", async () => {
		let keys = await getKeys()
		let sink = keys.map(async key => {
			let res = await axios
				.get('http://localhost:8000/')
				.catch(err => err.response)
			return res.status
		})


		let result = await Promise.all(sink)
		expect(result.every(status => status === 400)).toBe(true)
	})

	test("fails when token is missing", async () => {
		let keys = await getKeys()
		let sink = keys.map(async key => {
			let token = ''
			let config = {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			}

			let res = await axios
				.get('http://localhost:8000/admin', config)
				.catch(err => err.response)

			return res.status
		})


		let result = await Promise.all(sink)
		expect(result.every(status => status === 400)).toBe(true)
	})

	test("fails for invalid claims", async () => {
		let keys = await getKeys()
		let sink = keys.map(async key => {
			let claims = {
				sub: uuid(),
				exp: Date.now() + 15 * minute,
				iss: key.id,
			}

			let token = generateAccessToken(claims, Buffer.from(key.private_key))
			let config = {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			}

			let res = await axios
				.get('http://localhost:8000/admin', config)
				.catch(err => err.response)

			return res.status
		})


		let result = await Promise.all(sink)
		expect(result.every(status => status === 401)).toBe(true)
	})

	test("fails for expired token", async (): Promise<void> => {
		let keys = await getKeys()
		let sink = keys.map(async key => {
			let claims: Claims = {
				sub: uuid(),
				exp: Math.floor((Date.now() - minute) / 1000),
				iss: key.id,
				traits: [],
			}

			let token = generateAccessToken(claims, Buffer.from(key.private_key))
			let config = {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			}

			let res = await axios
				.get('http://localhost:8000', config)
				.catch(err => err.response)

			return res.status
		})


		let result = await Promise.all(sink)
		expect(result.every(status => status === 401)).toBe(true)
	})
})

type Keypair = {
    id: string;
    private_key: Array<number>;
    public_key: Array<number>;
}

type Keys = Array<Keypair>

async function getKeys(): Promise<Keys> {
	let res = await axios.get<Keys>('http://localhost:7000/keys/list')
	return res.data
}

function generateAccessToken(payload: any, key: Buffer) {
	return jwt.sign(
		JSON.stringify(payload),
		key,
		{
			algorithm: 'RS256',
			header: {
				typ: "JWT",
				alg: 'RS256',
			}
		}
	)
}