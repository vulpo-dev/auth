import type {
	AxiosInstance,
	AxiosRequestConfig,
	AxiosError,
    AxiosResponse,
} from 'axios'
import Axios from 'axios'

import { ErrorCode, AuthError } from './error'

import type { AuthClient } from './client'

export function addToken(axios: AxiosInstance, auth: AuthClient) {

	axios.interceptors.request.use(async function (config: AxiosRequestConfig) {
		try {
			let token = await auth.getToken()
			return {
				...config,
				headers: {
					...config.headers,
					'Authorization': `Bearer ${token}`,
				}
			}
		} catch (err) {
			if (Axios.isAxiosError(err) && getStatus(err) === 403){
				await auth.signOut()
			}

			throw err
		}
	})

	let onResponse = (res: AxiosResponse) => {
		return res
	}

	axios.interceptors.response.use(onResponse, async (error: AxiosError) => {
		let status = getStatus(error)

		if (status === 401) {
			let token = await auth.forceToken()
		    
		    let config = {
		    	...error.config,
		    	headers: {
		    		...(error.config.headers ?? {}),
		    		'Authorization': `Bearer ${token}`,
		    	}
		    }

		    return Axios
		    	.request(config)
		    	.catch(async err => {
		    		let status = getStatus(error)

		    		if (status === 401) {
		    			await auth.signOut()
		    			return Promise.reject(new AuthError(ErrorCode.SessionExpired, err.response))
		    		}

		    		return Promise.reject(err)
		    	})
		}

		return Promise.reject(error)
	})
}

function getStatus(error: AxiosError): number | null {
	return error?.response?.status ?? null
}