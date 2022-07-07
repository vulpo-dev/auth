import { errorFromResponse, ErrorCode, isErrorResponse, AbortError } from "./error"

export let makeId = (): () => number => {
	let id = 0
	return (): number => {
		let tmp = id
		id = id + 1
		return tmp
	}
}


export function getLanguages(arr: Array<string>): Array<string> {
	return arr.flatMap((lang, _, arr) => {
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



export type HttpError<T = any> = {
	response: Response,
	data: T,
}

export interface IHttpService {
	get<R>(url: string, config?: Partial<Request>): Promise<R>;
	post<R>(url: string, data?: unknown, config?: Partial<Request>): Promise<R>;
}

export class HttpSerivce implements IHttpService {
	private baseURL: string
	private project: string

	constructor(
		baseURL: string,
		project: string
	) {
		this.baseURL = baseURL
		this.project = project
	}

	private getHeaders(config: Partial<Request> = {}) {
		let currentHeaders = config.headers?.entries() ?? []
		return {
			'Vulpo-Project': this.project,
			'Content-Type': 'application/json',
			...Object.fromEntries(currentHeaders)
		}
	}

	private getUrl(url: string) {
		let pathname = url.startsWith('/') ? url.substring(1) : url
		return `${this.baseURL}/${pathname}`
	}

	private isEmpty(length: string | null): boolean {

		if (length === null) {
			return true
		}

		return parseInt(length, 10) === 0
	}

	async get<R = void>(url: string, config: Partial<Request> = {}): Promise<R> {
	    let response = await fetch(this.getUrl(url), {
	    	...config,
	    	mode: 'cors',
	    	method: 'GET',
	    	headers: this.getHeaders(config)
	    })
	    .catch(err => {
	    	if (config?.signal?.aborted) {
	    		return Promise.reject(new AbortError())
	    	}

	    	return Promise.reject(err)
	    })

	    let data = this.isEmpty(response.headers.get('content-length'))
	    	? null
	    	: await response.json()

	    if (response.status >= 400) {

	    	if (config?.signal?.aborted) {
	    		return Promise.reject(new AbortError())
	    	}

	    	let err = isErrorResponse(data)
	    		? data
	    		: { code: ErrorCode.GenericError }

	    	return Promise.reject(errorFromResponse(response, err))
	    }

	    return data as unknown as R
	}

	async post<R>(url: string, body: unknown, config: Partial<Request> = {}): Promise<R> {
	    let response = await fetch(this.getUrl(url), {
	    	...config,
	    	mode: 'cors',
	    	cache: 'no-cache',
	    	method: 'POST',
	    	headers: this.getHeaders(config),
	    	body: JSON.stringify(body)
	    })
	    .catch(err => {
	    	if (config?.signal?.aborted) {
	    		return Promise.reject(new AbortError())
	    	}

	    	return Promise.reject(err)
	    })

	    let data = this.isEmpty(response.headers.get('content-length'))
	    	? null
	    	: await response.json()

	    if (response.status >= 400) {

	    	if (config?.signal?.aborted) {
	    		return Promise.reject(new AbortError())
	    	}

	    	let err = isErrorResponse(data)
	    		? data
	    		: { code: ErrorCode.GenericError }

	    	return Promise.reject(errorFromResponse(response, err))
	    }

	    return data as unknown as R
	}
}

export function uuid(): string {
	if ('randomUUID' in self.crypto) {
		return self.crypto.randomUUID()
	}

	// https://stackoverflow.com/a/2117523/11383840
	// @ts-ignore
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, (c) => (c ^ self.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}
