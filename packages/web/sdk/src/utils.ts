import jwtDecode from 'jwt-decode'
import type { User, Token, AccessToken } from './types'

export let makeId = (): () => number => {
	let id = 0
	return (): number => {
		let tmp = id
		id = id + 1
		return tmp
	}
}


export function getLanguages(arr: Array<string>): Array<string> {
	return arr.flatMap((lang, index, arr) => {
		if (lang.length === 2) {
			return [lang]
		}

		let [fallback] = lang.split('-')
		
		if (arr.includes(fallback)) {
			return [lang]
		}

		return [lang, fallback]
	})
}