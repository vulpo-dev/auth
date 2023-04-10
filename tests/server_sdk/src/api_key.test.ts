import axios from 'axios'

describe("ApiKey", () => {
	test("returns ok", async () => {
		let token = generateApiKey('valid')
		
		let config = {
			headers: {
				'Authorization': `ApiKey ${token}`
			}
		}

		let res = await axios
			.get('http://localhost:8000', config)
			.catch(err => err.response)

		expect(res.status).toBe(200)
	})

	test("returns unauthorized when token is expired", async () => {
		let token = generateApiKey('expired')
		
		let config = {
			headers: {
				'Authorization': `ApiKey ${token}`
			}
		}

		let res = await axios
			.get('http://localhost:8000', config)
			.catch(err => err.response)

		expect(res.status).toBe(401)
	})

	test("returns 500 when claims are invalid", async () => {
		let token = generateApiKey('invalid')
		
		let config = {
			headers: {
				'Authorization': `ApiKey ${token}`
			}
		}

		let res = await axios
			.get('http://localhost:8000', config)
			.catch(err => err.response)

		expect(res.status).toBe(500)
	})
})

function generateApiKey(id: string, payload = '') {
	return Buffer
		.from(`${id}:${payload}`)
		.toString('base64')
}