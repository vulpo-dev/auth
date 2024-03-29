import { AuthClient } from './client'
import { Config } from './types'

import { KeyStorage, SessionsStorage, StorageEvents, Storage } from './storage'
import { SessionService } from './session'
import { Tokens } from './tokens'
import { HttpSerivce } from './utils'

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
	ApiKey,
	ApiKeys,
	UpdateEmailPayload,
	ConfirmUpdateEmailPayload,
	RejectUpdateEmailPayload,
	UserSetPasswordPayload,
	GenerateApiKeyResponse,
	DeleteApiKeyPayload,
	GenerateApiKey,
	PasswordResetPayload,
	VerifyResetTokenPayload,
	VerifyPasswordlessPayload,
	RequestPasswordlessPayload,
	ConfirmPasswordlessPayload,
	RefreshAccessTokenPayload,
	VerifyEmailPayload,
	UpdateUserPayload,
	Claims,
	PasswordlessResponse,
} from './types'

export { UserState, Flag, Url } from './types'
export type { SessionId } from './types'
export { AuthClient } from './client'
export type { ClientDep, IAuthClient } from './client'
export { ErrorCode, AuthError, isErrorCode } from './error'
export type { ApiError, ErrorResponse, GenericError, Code } from './error'
export { SessionService } from './session'
export type { SessionServiceDep, FromSessionResponse } from './session'
export type { IKeyStorage, ISessionsStorage, IStorage, Session, Key, SessionsChangeCallback, ActiveUserCallback } from './storage'
export type { Tokens } from './tokens'
export type { IHttpService } from './utils'
export { uuid } from './utils'

export let Auth = {
	create(config: Config): AuthClient {
		let httpService = config.http ?? new HttpSerivce(config.baseURL, config.project)

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

		if (config.preload ?? true) {
			client.forceToken().catch(() => {})
		}

		return client
	}	
}