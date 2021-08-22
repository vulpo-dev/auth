
import * as jwt from 'jsonwebtoken'
import { Algorithm } from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'

type GenerateAccessToken = {
	payload?: any;
	algorithm?: Algorithm;
}

type PrivateKey = {
	key: string;
	passphrase: string;
}

export function makeGenerateAccessToken(key: string | PrivateKey) {
	return function generateAccessToken({
		payload = {},
		algorithm = 'RS256',
	}: GenerateAccessToken = {}) {
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
}

export function makeGenerateInvalidAccessToken(key: string) {
	return function generateInvalidAccessToken({
		payload = {},
		algorithm = 'RS256',
	}: GenerateAccessToken = {}) {
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
}

export function makeTokenPayload(
	sub: string,
	iss: string,
) {
	return function tokenPayload(minutes = 5) {
		let now = new Date()
		let exp = Math.ceil(now.setMinutes(now.getMinutes() + minutes) / 1000)
		return {
			exp,
			sub,
			iss,
			traits: [],
		}
	}
}

export function ratPayload(minutes = 5, jti?: string) {
	let now = new Date()
	let exp = Math.ceil(now.setMinutes(now.getMinutes() + minutes) / 1000)
	return {
		exp,
		jti: jti ?? uuid()
	}
}