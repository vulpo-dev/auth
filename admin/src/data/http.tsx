import { ReactNode } from 'react'

import { createContext, useContext, FC, useMemo } from 'react'
import Axios from 'axios'
import type { AxiosInstance } from 'axios'
import { AuthClient } from '@vulpo-dev/auth-sdk'
import { addToken } from '@vulpo-dev/auth-sdk/lib/interceptor'

export let CancelToken = Axios.CancelToken

let HttpCtx = createContext<AxiosInstance>(Axios)

type Props = {
	project?: string | null;
	auth: AuthClient | null;
	children: ReactNode,
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

		// had to use any here because the
		// build was throwing a mismatched type
		// error inside of docker build
		addToken(instance as any, auth)

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
