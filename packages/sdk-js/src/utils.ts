import jwtDecode from 'jwt-decode'
import type { User } from './types'

export let makeId = (): (() => number) => {
	let id = 0
	return (): number => {
		let tmp = id
		id = id + 1
		return tmp
	}
}

export function getUser(access_token: string): User {
	let token = jwtDecode<{ user: User }>(access_token)
	return token?.user
}
