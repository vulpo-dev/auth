import { createAccessToken, createUser } from "../utils/user"
import { generateApiKeyRequest } from "./utils"
import Db from '../utils/db'
import Http from '../utils/http'

import { DeleteApiKeyPayload, Url } from '@sdk-js/types'

afterAll(() => Db.end())

describe('delete api key', () => {
	test('can delete key', async () => {
		let user = await createUser()
		let accessToken = createAccessToken({ user })
		let key = await generateApiKeyRequest(accessToken)

		let payload: DeleteApiKeyPayload = {
			id: key.id
		}

		let res = await Http.post(Url.DeleteApiKey, payload, {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			}
		})

		expect(res.status).toBe(200)
		expect(await keyExist(key.id)).toBeFalsy()
	})
})

async function keyExist(id: string): Promise<boolean> {
	let { rows } = await Db.query(`
		select id
		  from api_keys
		 where id = $1
	`, [id])


	return rows.length > 0
}