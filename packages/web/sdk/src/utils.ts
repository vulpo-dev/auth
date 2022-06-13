import { AxiosRequestConfig, AxiosResponse } from "axios"


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


export interface IHttpService {
	get<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R>;
	post<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
}
