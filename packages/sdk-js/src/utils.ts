import jwtDecode from 'jwt-decode'
import type { User, Token, AccessToken } from 'types'

export let makeId = (): (() => number) => {
	let id = 0
	return (): number => {
		let tmp = id
		id = id + 1
		return tmp
	}
}

export function getUser(token: AccessToken): User {
	let { user } = jwtDecode<{ user: User }>(token)
	return user 
}
