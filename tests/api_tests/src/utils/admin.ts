import { adminKeys } from '@vulpo-dev/auth-seeds/data/projects'
import { Claims } from '@vulpo-dev/auth-sdk'
import * as jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'

export function generateAdminToken(invalid = false) {

	let payload: Claims = {
		sub: uuid(),
		traits: invalid ? [] : ['Admin'],
		exp: Math.round(new Date(Date.now() + 15 * 60 * 1000).getTime() / 1000),
	}

	return jwt.sign(
		JSON.stringify(payload),
		adminKeys.private_key,
		{
			algorithm: 'ES384'
		}
	)
}