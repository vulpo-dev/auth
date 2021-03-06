import type {
	AxiosInstance,
	AxiosRequestConfig,
	AxiosError,
} from 'axios'

import Axios from 'axios'

import type { AuthClient } from 'client'

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
			throw new Axios.Cancel(err.message)
		}
	})

	axios.interceptors.response.use(res => res, async (error: AxiosError) => {
		const status = error.response ? error.response.status : null
		if (status === 401) {
			let token = await auth.forceToken()
		    
		    let config = {
		    	...error.config,
		    	headers: {
		    		...(error.config.headers ?? {}),
		    		'Authorization': `Bearer ${token}`,
		    	}
		    }

		    return Axios.request(config)
		}

		return Promise.reject(error)
	})
}