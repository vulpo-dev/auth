import React from 'react'

import { createContext, useContext, FC, useMemo, useEffect } from 'react'
import Axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios'
import { AuthClient } from '@riezler/auth-sdk'

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
				'Bento-Project': project
			},
		})

		instance.interceptors.request.use(async function (config) {
			try {
				let token = await auth
					.getToken()

				return {
					...config,
					headers: {
						...config.headers,
						'Authorization': `Bearer ${token}`,
					}
				};
			} catch (err) {
				throw new Axios.Cancel(err.message)
			}
		})

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

export enum ErrorCode {
	InternalServerError = 'internal_error',
	BadRequest = 'bad_request',
	NotFound = 'not_found',
	NotAllowed = 'forbidden',
	Unavailable = 'unavailable',
	GenericError = 'generic_error',

	ProjectNameExists = 'project/name_exists',

}

export class ApiError extends Error {
	code: ErrorCode;

	constructor(code: ErrorCode) {
		super(code)
		this.name = 'HttpError'
		this.code = code
	}
}

export class GenericError extends Error {
	code = ErrorCode.GenericError
	
	constructor(message?: string) {
		super(message)
	}
}

export class HttpError extends Error {
	code: ErrorCode;

	constructor(code: ErrorCode) {
		super(code)
		this.name = 'HttpError'
		this.code = code
	}
}

export type RequestError
	= ApiError
	| HttpError
	| GenericError

export type ErrorResponse = {
	code: ErrorCode
}

export function getError(
	res: AxiosError<ErrorResponse>
): RequestError {
	if (res.response?.status === 503) {
		return new HttpError(ErrorCode.Unavailable)
	}

	switch(res.response?.data?.code) {
		case ErrorCode.NotFound:
		case ErrorCode.BadRequest:
		case ErrorCode.InternalServerError:
		case ErrorCode.NotAllowed:
			return new HttpError(res.response.data.code)

		case ErrorCode.ProjectNameExists:
			return new ApiError(res.response?.data.code)

		default:
			return new GenericError(res.response?.statusText)
	}
}