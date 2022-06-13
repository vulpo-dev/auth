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

export {
	UserState,
} from './types'

export {
	Flag,
	Url,
} from './types'

export { CancelToken, AuthClient } from './client'
export { addToken } from './interceptor'
export { ApiError, ErrorCode, HttpError, AuthError } from './error'


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
			config,
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
			config,
			keyStorage
		})

		if (config.preload) {
			client.forceToken().catch(() => {})
		}

		return client
	}	
}