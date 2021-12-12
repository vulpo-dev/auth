
import Db from '../utils/db'
import Http from '../utils/http'
import { createUser } from '../utils/user'
import { admin } from '@seeds/data/projects'
import { generateApiKey } from './utils'

afterAll(() => Db.end())

describe("ApiKey Admin guard", () => {
	test("can call API", async () => {
		let user = await createUser({
			traits: ['Admin'],
			project: admin.id, 
		})

		let apiKey = await generateApiKey(user.id, null)

		let res = await Http.get('/admin/__/project/list', {
			headers: {
				'Authorization': `ApiKey ${apiKey.value}`
			}
		})
		.catch(err => err.response)

		expect(res.status).toEqual(200)
	})
})
