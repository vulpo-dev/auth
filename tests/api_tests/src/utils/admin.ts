import { adminKeys } from '@seeds/data/projects'
import { Claims } from '@sdk-js/types'

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
		{
			key: adminKeys.private_key,
			passphrase: 'password',
		},
		{
			algorithm: 'RS256'
		}
	)
}