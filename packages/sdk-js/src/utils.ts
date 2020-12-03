import jwtDecode from 'jwt-decode'
import type { User, Token } from './types'

export let makeId = (): (() => number) => {
	let id = 0
	return (): number => {
		let tmp = id
		id = id + 1
		return tmp
	}
}

export function getUsers(tokens: Array<Token>): Array<User> {
	return tokens.map(value => {
		let token = jwtDecode<{ user: User }>(value.access_token)
		return token?.user
	})
}

export function last<T>(arr: Array<T>): T | undefined {
	return arr[arr.length - 1]
}