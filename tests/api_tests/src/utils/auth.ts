import { CreatedSession } from './passwordless'

import { v4 as uuid } from 'uuid'
import * as jwt from 'jsonwebtoken'
import { Algorithm } from 'jsonwebtoken'

type PrivateKey = {
	key: string;
	passphrase: string;
}

export type GenerateAccessToken = {
	minutes?: number;
	algorithm?: Algorithm;
	key: string | PrivateKey;
	payload?: any;
} 

export function generateAccessToken({
	key,
	minutes,
	algorithm = 'RS256',
	payload = {},
}: GenerateAccessToken) {
	return jwt.sign(
		JSON.stringify(payload),
		key,
		{
			algorithm,
			header: {
				typ: "JWT",
				alg: algorithm,
			}
		}
	)
}

export function ratPayload(minutes = 10) {
	let now = new Date()
	let exp = Math.ceil(now.setMinutes(now.getMinutes() + minutes) / 1000)
	return {
		exp,
		jti: uuid()
	}
}
