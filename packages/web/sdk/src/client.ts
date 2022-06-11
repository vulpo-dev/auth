import {
	Config,
	AuthCallback,
	Unsubscribe,
	User,
	SessionResponse,
	SetPasswordPayload,
	Url,
	Flag,
	SessionInfo,
	EmailPasswordPayload,
	PasswordResetPayload,
	VerifyResetTokenPayload,
    RequestPasswordlessPayload,
    PasswordlessResponse,
    ConfirmPasswordlessPayload,
    VerifyPasswordlessPayload,
    VerifyEmailPayload,
    OAuthAuthorizeUrlPayload,
    OAuthAuthorizeUrlResponse,
} from './types'

import { SessionService } from './session'
import {
	Session as SessionEntry,
	SessionsStorage,
	KeyStorage,
	OAuthState,
	Storage,
	StorageEvents,
} from './storage'
import { Tokens } from './tokens'
import {
	ApiError,
	ErrorCode,
	ClientError,
	SessionNotFoundError,
	SessionKeysNotFoundError,
	ErrorResponse,
    AuthError,
} from './error'
import { getPublicKey, ratPayload } from './keys'
import { getLanguages } from './utils'
import { v4 as uuid } from 'uuid'

import Axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'

export const CancelToken = Axios.CancelToken;


type ClientDep = {
	sessionService: SessionService,
	tokens: Tokens,
	httpService: AxiosInstance,
	config: Config,
	keyStorage: KeyStorage,
}

export class AuthClient {
	private sessionService: SessionService;
	private tokens: Tokens;
	private httpService: AxiosInstance;
	private error: ApiError = new ApiError();
	private config: Config;
	private keyStorage: KeyStorage;
		
	constructor(dep: ClientDep) {
		this.sessionService = dep.sessionService
		this.tokens = dep.tokens
		this.httpService = dep.httpService
		this.config = dep.config
		this.keyStorage = dep.keyStorage
	}

	private async emailPasswordAuth(
		url: Url.SignIn | Url.SignUp,
		email: string,
		password: string,
		config?: AxiosRequestConfig
	) {
		let session = await this.sessionService.create()
		let public_key = await getPublicKey(session)

		let payload: EmailPasswordPayload = {
			email,
			password,
			public_key, 
			session: session.id,
			device_languages: getLanguages([...navigator.languages]),
		}

		let onError = async (res: AxiosError<ErrorResponse>) => {
			await this.sessionService.remove(session.id)
			return Promise.reject(this.error.fromResponse(res))
		}

		let { data } = await this.httpService
			.post<SessionResponse>(url, payload, config)
			.catch(onError)
		
		let { user } = await this.sessionService
			.fromResponse(data)
			.catch(onError)

		this.sessionService.activate(data.session)
		this.tokens.fromResponse(data)
		return user!
	}

	/**
	 * Create a new session with Email and Password
	 * 
	 * @param email - The user email address
	 * @param password - The user password
 	 * @returns the user
	*/
	async signIn(email: string, password: string, config?: AxiosRequestConfig): Promise<User> {
		return await this.emailPasswordAuth(
			Url.SignIn,
			email,
			password,
			config
		)
	}

	/**
	 * Create a new session with Email and Password and create the user if not exists
	 * 
	 * @param email - The user email address
	 * @param password - The user password
	*/
	async signUp(email: string, password: string, config?: AxiosRequestConfig): Promise<User> {
		return await this.emailPasswordAuth(
			Url.SignUp,
			email,
			password,
			config
		)
	}

	private async removeSession(
		url: Url.SignOut | Url.SignOutAll,
		sessionId?: string,
		config?: AxiosRequestConfig,
	) {
		let session = sessionId ?? this.sessionService.active?.id

		if (!session) {
			return
		}

		let value = await this.sessionService.generateAccessToken(session, ratPayload())
		await this.sessionService.remove(session)
		let _url = url.replace(':session', session)
		return await this.httpService
			.post(_url, { value }, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	/**
	 * Sign out a user from the current session
	 * 
	 * @param sessionId when sessionId is undefined, the currently active session will be used
	*/
	async signOut(sessionId?: string, config?: AxiosRequestConfig): Promise<unknown> {
		return await this.removeSession(Url.SignOut, sessionId, config)
	}

	/**
	 * Sign out a user from all sessions
	 * 
	 * @param sessionId when sessionId is undefined, the currently active session will be used
	*/
	async signOutAll(sessionId?: string, config?: AxiosRequestConfig): Promise<unknown> {
		return await this.removeSession(Url.SignOutAll, sessionId, config)
	}

	private async getAccessToken(
		fn: (session: SessionEntry) => Promise<string>,
		sessionId?: string,
	) {
		try {
			let info = this.sessionService.current(sessionId)
			if (!info) {
				return Promise.reject(new SessionNotFoundError())
			}

			let keys = await this.keyStorage.get(info.id)
			if (!keys) {
				this.sessionService.setCurrent(null)
				return Promise.reject(new SessionKeysNotFoundError())
			}

			let session = { ...info, ...keys }
			return await fn(session)
		} catch (res) {
			let err = res instanceof ClientError
				? res
				: this.error.fromResponse(res as AxiosError)

			if (this.sessionService.active) {
				await this.sessionService.remove(this.sessionService.active.id)
			}

			throw err
		}
	}

	/**
	 * Get an AccessToken for a given session, getting a new token when the current
	 * token expires
	 * 
	 * @param sessionId when sessionId is undefined, the currently active session will be used
	*/
	async getToken(sessionId?: string): Promise<string> {
		return await this.getAccessToken(this.tokens.getToken, sessionId)
	}

	/**
	 * Get a new AccessToken for a given session, this method will force a new tokem
	 * even if the current token is still valid
	 * 
	 * @param sessionId when sessionId is undefined, the currently active session will be used
	*/
	async forceToken(sessionId?: string): Promise<string> {
		return await this.getAccessToken(this.tokens.forceToken, sessionId)
	}

	/**
	 * Request to reset the current user password, if the user exists a rest email
	 * will be send to the given email address, no email will be send if the user
	 * does not exits, however the success screen will be shown in both cases
	 * 
	 * @param email - the user email address
	*/
	async resetPassword(email: string, config?: AxiosRequestConfig): Promise<void> {
		let payload: PasswordResetPayload = { email }
		await this.httpService
			.post(Url.RequestPasswordReset, payload, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	/**
	 * This method is use in combination with the {@link AuthClient.resetPassword} method, the generated link
	 * to reset your password contains a token id and the token value that will be used to
	 * reset the password
	*/
	async setResetPassword(body: SetPasswordPayload, config?: AxiosRequestConfig): Promise<void> {
		await this.httpService
			.post(Url.PasswordReset, body, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	/**
	 * Update a Users password
	*/
	async setPassword(password: string, config?: AxiosRequestConfig): Promise<void> {
		let currentSession = this.sessionService.current()
		
		if (!currentSession) {
			return
		}

		let accessToken = await this.getToken(currentSession.id)

		await this.httpService
			.post(Url.UserSetPassword, { password }, {
				...config,
				headers: {
					...(config?.headers ?? {}),
					'Authorization': `Bearer ${accessToken}`,
				}
			})
			.catch(err => Promise.reject(this.error.fromResponse(err)))


		await this.sessionService.fromResponse({
			session: currentSession.id,
			expire_at: currentSession.expire_at!,
			access_token: accessToken
		})
		
		this.sessionService.activate(currentSession.id)
	}

	/**
	 * This method is used in combination with the {@link AuthClient.setPassword} method and is used to
	 * valid whether the given token is valid or not
	*/
	async verifyToken(id: string, token: string, config?: AxiosRequestConfig): Promise<void> {
		let payload: VerifyResetTokenPayload = { id, token }
		await this.httpService
			.post(Url.VerifyResetToken, payload, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	/**
	 * Create new session using an authentication link, if the user does not exits, a new
	 * user will be created
	*/
	async passwordless(email: string, config?: AxiosRequestConfig): Promise<{ id: string; session: string }> {
		let session = await this.sessionService.create()
		let public_key = await getPublicKey(session)

		let payload: RequestPasswordlessPayload = {
			email,
			public_key, 
			session: session.id,
			device_languages: getLanguages([...navigator.languages]),
		}

		let { data } = await this.httpService
			.post<PasswordlessResponse>(Url.Passwordless, payload, config)
			.catch(async err => {
				await this.sessionService.remove(session.id)
				return Promise.reject(this.error.fromResponse(err))
			})

		return { id: data.id, session: session.id }
	}

	/**
	 * This method is used in combination with the {@link AuthClient.passwordless} method and is used
	 * to confim the authentication link
	*/
	async confirmPasswordless(id: string, token: string, config?: AxiosRequestConfig): Promise<void> {
		let payload: ConfirmPasswordlessPayload = { id, token }
		await this.httpService
			.post(Url.PasswordlessConfim, payload, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	/**
	 * Verify a users email address
	*/
	async verifyEmail(id: string, token: string, config?: AxiosRequestConfig): Promise<void> {
		let payload: VerifyEmailPayload = { id, token }
		await this.httpService
			.post(Url.UserVerifyEmail, payload, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	/**
	 * This method is used in combination witht the {@link AuthClient.passwordless} method, it pulls the
	 * server for update and resolves the promise once the authentication link has been confirmed
	*/
	verifyPasswordless(id: string, session: string, config?: AxiosRequestConfig): Promise<User | null> {
		return new Promise((resolve, reject) => {
			let device_languages = getLanguages([...navigator.languages])

			let check = async () => {
				let token = await this.sessionService.generateAccessToken(session, ratPayload())

				if (!token) {
					reject(null)
					return
				}

				let payload: VerifyPasswordlessPayload = {
					id,
					token,
					session,
					device_languages,
				}

				let { data } = await this.httpService
					.post<SessionResponse>(Url.PasswordlessVerify, payload, config)

				this.tokens.fromResponse(data)
				let { user } = await this.sessionService.fromResponse(data)

				this.sessionService.activate(data.session)
				resolve(user!)
			}

			let loop = () => {
				check().catch(async err => {
					let error = this.error.fromResponse(err)
					if (error.code === ErrorCode.PasswordlessAwaitConfirm) {
						setTimeout(loop, 1000)
					} else if (Axios.isCancel(err)) {
						resolve(null)
					} else {
						await this.sessionService.remove(session)
						reject(error)
					}
				})	
			}

			loop()
		})
	}

	/**
	 * The callback will be called when the session information changes
	*/
	authStateChange(cb: AuthCallback): Unsubscribe {
		let sub = this.sessionService.subscribe(cb)
		let session = this.sessionService.current(this.sessionService.active?.id)
		cb(session)
		return sub
	}

	/**
	 * Activate a new session for a given userId
	*/
	activate(userId: string) {
		this.sessionService.activate(userId)
	}

	/**
	 * Get the current session ID
	*/
	get active(): SessionInfo | null {
		return this.sessionService.active
	}

	/**
	 * `withToken` can be used to make http calls, the callback will receive the current access token.
	 * When the request returns a `401`, a new access token will be requested and the request will
	 * be retried
	*/
	async withToken(fn: (token: string) => Promise<Response>, session?: string): Promise<Response> {
		let token = await this.getToken(session)

		return fn(token).then(async response => {
			if (response.status === 401) {
				let token = await this.forceToken(session)
				return fn(token).catch(async error => {
		    		let status = error?.response?.status

		    		if (status === 401) {
		    			await this.signOut()
		    			return Promise.reject(new AuthError(ErrorCode.SessionExpired))
		    		}

		    		return Promise.reject(error)
		    	})
			}

			return response
		})
	}

	/**
	 * get the currently active flags for a project
	*/
	async flags(config?: AxiosRequestConfig): Promise<Array<Flag>> {
		return this.httpService
			.get<{ items: Array<Flag> }>(`${Url.Flags}?project=${this.config.project}`, config)
			.then(res => res.data.items)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	/**
	 * get the currently active user
	*/
	getUser(): User | null {
		return this.sessionService.getActiveUser()
	}


	/**
	 * get the authorization url for a given OAuth provider
	*/
	async oAuthGetAuthorizeUrl(provider: 'google', config?: AxiosRequestConfig): Promise<string> {
		let request_id = uuid()

		let payload: OAuthAuthorizeUrlPayload = {
			request_id
		}

		OAuthState.insert(provider, request_id)

		return this.httpService
			.post<OAuthAuthorizeUrlResponse>(`/oauth/${provider}/authorize_url`, payload, config)
			.then(res => res.data.url)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	/**
	 * handle the OAuth callback and sign in the user if the
	 * code and csrf_token are valid
	*/
	async oAuthConfirm(csrf_token: string, code: string, config?: AxiosRequestConfig): Promise<[User | null, string]> {
		let oAuthState = OAuthState.get()

		if (!oAuthState) {
			return [null, '/']
		}

		let session = await this.sessionService.create()
		let public_key = await getPublicKey(session)

		let onError = async (res: AxiosError<ErrorResponse>) => {
			OAuthState.delete()
			await this.sessionService.remove(session.id)
			return Promise.reject(this.error.fromResponse(res))
		}

		let payload = {
			request_id: oAuthState.requestdId,
			csrf_token,
			code,

			public_key,
			session: session.id,
			device_languages: getLanguages([...navigator.languages]),
		}

		let { data } = await this.httpService
			.post<SessionResponse>(`/oauth/${oAuthState.provider}/confirm`, payload, config)
			.catch(onError)
		
		let { user } = await this.sessionService
			.fromResponse(data)
			.catch(onError)

		this.sessionService.activate(data.session)
		this.tokens.fromResponse(data)
		OAuthState.delete()
		
		return [user!, oAuthState.referrer]
	}
}

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

export default Auth
