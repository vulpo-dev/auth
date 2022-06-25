import { AuthClient } from './client'
import { Config } from './types'

import Axios from 'axios'
import { KeyStorage, SessionsStorage, StorageEvents, Storage } from './storage'
import { SessionService } from './session'
import { Tokens } from './tokens'


export type {
	User,
	TokenResponse,
	Config,
	AuthCallback,
	Unsubscribe,
	PasswordOptions,
	Token,
	TokenListener,
	SetPasswordPayload,
	SessionInfo,
	SessionResponse,
	EmailPasswordPayload,
	UserAuthState,
} from './types'

export { UserState, Flag, Url } from './types'
export type { SessionId } from './types'
export { CancelToken, AuthClient } from './client'
export type { ClientDep, IAuthClient } from './client'
export { addToken } from './interceptor'
export { ApiError, ErrorCode, HttpError, AuthError } from './error'
export type { ErrorResponse, GenericError } from './error'
export { SessionService } from './session'
export type { SessionServiceDep, FromSessionResponse } from './session'
export type { IKeyStorage, ISessionsStorage, IStorage, Session, Key, SessionsChangeCallback, ActiveUserCallback } from './storage'
export type { Tokens } from './tokens'
export type { IHttpService } from './utils'
export type { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios'


export let Auth = {
	create(config: Config): AuthClient {

		let httpService = config.http ?? Axios.create({
			baseURL: config.baseURL,
			headers: {
				'Vulpo-Project': config.project
			}
		})

		let storageEvents = new StorageEvents()
		let storage = new Storage({ storageEvents })
		let keyStorage = new KeyStorage()
		let sessionStorage = new SessionsStorage({
			keyStorage,
			storageEvents,
		})

		let sessionService = new SessionService({
			httpService,
			sessionStorage,
			keyStorage,
			storage,
		})

		let tokens = new Tokens(sessionService, httpService)

		let client = new AuthClient({
			sessionService,
			tokens,
			httpService,
			projectId: config.project,
			keyStorage
		})

		if (config.preload) {
			client.forceToken().catch(() => {})
		}

		return client
	}	
}