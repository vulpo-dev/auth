import React from 'react'

import { createContext, useContext, FC, useMemo, useEffect } from 'react'
import Axios from 'axios'
import {
	AxiosInstance,
	AxiosError,
	AxiosResponse,
	AxiosRequestConfig,
} from 'axios'
import { AuthClient, addToken } from '@vulpo-dev/auth-sdk'

export let CancelToken = Axios.CancelToken

let HttpCtx = createContext<AxiosInstance>(Axios)

type Props = {
	project?: string | null;
	auth: AuthClient | null;
}

export let Http: FC<Props> = ({ auth, project, children }) => {
	let httpClient = useMemo(() => {

		if (!auth || !project) {
			return Axios
		}

		let instance = Axios.create({
			baseURL: '/',
			headers: {
				'Vulpo-Project': project
			},
		})

		addToken(instance, auth)

		return instance
	}, [project, auth])

	return (
		<HttpCtx.Provider value={httpClient}>
			{ children }
		</HttpCtx.Provider>
	)
}

export function useHttp() {
	return useContext(HttpCtx)
}
