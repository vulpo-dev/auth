import Db from '../utils/db'
import Http from '../utils/http'

import { v4 as uuid } from 'uuid'
import * as bcrypt from 'bcryptjs'
import { project } from '@seeds/data/projects'
import { GenerateApiKey, GenerateApiKeyResponse, Url } from '@sdk-js/types'

export async function generateApiKey(userId: string, expire_at: null | string) {
	let id = uuid()
	let token = uuid()

	let value = Buffer.from(`${id}:${token}`).toString('base64')
	let hashedToken = bcrypt.hashSync(token)

	await Db.query(`
		insert into api_keys(id, token, user_id, expire_at, project_id)
		values($1, $2, $3, $4, $5)
		returning id
	`, [id, hashedToken, userId, expire_at, project.id])

	return { id, token, value, expire_at }
}

export async function generateApiKeyRequest(accessToken: string) {
	let payload: GenerateApiKey = {
		name: uuid()
	}

	let res = await Http.post<GenerateApiKeyResponse>(Url.GenerateApiKey, payload, {
		headers: {
			'Authorization': `Bearer ${accessToken}`,
		}
	})

	return res.data
}