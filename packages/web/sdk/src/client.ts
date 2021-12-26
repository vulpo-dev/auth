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
} from './types'

import { Session } from './session'
import { Session as SessionEntry } from './storage'
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
import { createSession, getPublicKey, generateAccessToken, ratPayload } from './keys'
import { Sessions, Keys } from './storage'
import { getLanguages } from './utils'

import Axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'

export const CancelToken = Axios.CancelToken;

export class AuthClient {
	private session: Session;
	private tokens: Tokens;
	private http: AxiosInstance;
	private error: ApiError = new ApiError();
	private config: Config;
		
	constructor(
		session: Session,
		tokens: Tokens,
		http: AxiosInstance,
		config: Config,
	) {
		this.session = session
		this.tokens = tokens
		this.http = http
		this.config = config
	}

	private async emailPasswordAuth(
		url: Url.SignIn | Url.SignUp,
		email: string,
		password: string,
		config?: AxiosRequestConfig
	) {
		let session = await createSession()
		let public_key = await getPublicKey(session)

		let payload: EmailPasswordPayload = {
			email,
			password,
			public_key, 
			session: session.id,
			device_languages: getLanguages([...navigator.languages]),
		}

		let onError = async (res: AxiosError<ErrorResponse>) => {
			await Sessions.delete(session.id)
			return Promise.reject(this.error.fromResponse(res))
		}

		let { data } = await this.http
			.post<SessionResponse>(url, payload, config)
			.catch(onError)
		
		let { user } = await this.session
			.fromResponse(data)
			.catch(onError)

		this.session.activate(data.session)
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
		let session = sessionId ?? this.session.active?.id

		if (!session) {
			return
		}

		let value = await generateAccessToken(session, ratPayload())
		await this.session.remove(session)
		let _url = url.replace(':session', session)
		return await this.http
			.post(_url, { value }, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	/**
	 * Sign out a user from the current session
	 * 
	 * @param if sessionId is undefined, the currently active session will be used
	*/
	async signOut(sessionId?: string, config?: AxiosRequestConfig): Promise<unknown> {
		return await this.removeSession(Url.SignOut, sessionId, config)
	}

	/**
	 * Sign out a user from all sessions
	 * 
	 * @param if sessionId is undefined, the currently active session will be used
	*/
	async signOutAll(sessionId?: string, config?: AxiosRequestConfig): Promise<unknown> {
		return await this.removeSession(Url.SignOutAll, sessionId, config)
	}

	private async getAccessToken(
		fn: (session: SessionEntry) => Promise<string>,
		sessionId?: string,
	) {
		try {
			let info = this.session.current(sessionId)
			if (!info) {
				return Promise.reject(new SessionNotFoundError())
			}

			let keys = await Keys.get(info.id)
			if (!keys) {
				this.session.setCurrent(null)
				return Promise.reject(new SessionKeysNotFoundError())
			}

			let session = { ...info, ...keys }
			return await fn(session)
		} catch (res) {
			let err = res instanceof ClientError
				? res
				: this.error.fromResponse(res as AxiosError)

			if (this.session.active) {
				await this.session.remove(this.session.active.id)
			}

			throw err
		}
	}

	/**
	 * Get an AccessToken for a given session, getting a new token when the current
	 * token expires
	 * 
	 * @param if sessionId is undefined, the currently active session will be used
	*/
	async getToken(sessionId?: string): Promise<string> {
		return await this.getAccessToken(this.tokens.getToken, sessionId)
	}

	/**
	 * Get a new AccessToken for a given session, this method will force a new tokem
	 * even if the current token is still valid
	 * 
	 * @param if sessionId is undefined, the currently active session will be used
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
		await this.http
			.post(Url.RequestPasswordReset, payload, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	/**
	 * This method is use in combination with the {@link AuthClient.resetPassword} method, the generated link
	 * to reset your password contains a token id and the token value that will be used to
	 * reset the password
	*/
	async setResetPassword(body: SetPasswordPayload, config?: AxiosRequestConfig): Promise<void> {
		await this.http
			.post(Url.PasswordReset, body, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	/**
	 * Update a Users password
	*/
	async setPassword(password: string, config?: AxiosRequestConfig): Promise<void> {
		let currentSession = this.session.current()
		
		if (!currentSession) {
			return
		}

		let accessToken = await this.getToken(currentSession.id)

		await this.http
			.post(Url.UserSetPassword, { password }, {
				...config,
				headers: {
					...(config?.headers ?? {}),
					'Authorization': `Bearer ${accessToken}`,
				}
			})
			.catch(err => Promise.reject(this.error.fromResponse(err)))


		await this.session.fromResponse({
			session: currentSession.id,
			expire_at: currentSession.expire_at!,
			access_token: accessToken
		})
		
		this.session.activate(currentSession.id)
	}

	/**
	 * This method is used in combination with the {@link AuthClient.setPassword} method and is used to
	 * valid whether the given token is valid or not
	*/
	async verifyToken(id: string, token: string, config?: AxiosRequestConfig): Promise<void> {
		let payload: VerifyResetTokenPayload = { id, token }
		await this.http
			.post(Url.VerifyResetToken, payload, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	/**
	 * Create new session using an authentication link, if the user does not exits, a new
	 * user will be created
	*/
	async passwordless(email: string, config?: AxiosRequestConfig): Promise<{ id: string; session: string }> {
		let session = await createSession()
		let public_key = await getPublicKey(session)

		let payload: RequestPasswordlessPayload = {
			email,
			public_key, 
			session: session.id,
			device_languages: getLanguages([...navigator.languages]),
		}

		let { data } = await this.http
			.post<PasswordlessResponse>(Url.Passwordless, payload, config)
			.catch(async err => {
				await Sessions.delete(session.id)
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
		await this.http
			.post(Url.PasswordlessConfim, payload, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	/**
	 * Verify a users email address
	*/
	async verifyEmail(id: string, token: string, config?: AxiosRequestConfig): Promise<void> {
		let payload: VerifyEmailPayload = { id, token }
		await this.http
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
				let token = await generateAccessToken(session, ratPayload())

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

				let { data } = await this.http
					.post<SessionResponse>(Url.PasswordlessVerify, payload, config)

				this.tokens.fromResponse(data)
				let { user } = await this.session.fromResponse(data)

				this.session.activate(data.session)
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
						await Sessions.delete(session)
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
		let sub = this.session.subscribe(cb)
		let session = this.session.current(this.session.active?.id)
		cb(session)
		return sub
	}

	/**
	 * Activate a new session for a given userId
	*/
	activate(userId: string) {
		this.session.activate(userId)
	}

	/**
	 * Get the current session ID
	*/
	get active(): SessionInfo | null {
		return this.session.active
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
		return this.http
			.get<{ items: Array<Flag> }>(`${Url.Flags}?project=${this.config.project}`, config)
			.then(res => res.data.items)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	/**
	 * get the currently active user
	*/
	getUser(): User | null {
		return this.session.getActiveUser()
	}
}

export let Auth = {
	create(config: Config): AuthClient {

		let http = config.http ?? Axios.create({
			baseURL: config.baseURL,
			headers: {
				'Bento-Project': config.project
			}
		})

		let sessions = new Session(config, http)
		let tokens = new Tokens(sessions, http)

		let client = new AuthClient(
			sessions,
			tokens,
			http,
			config,
		)

		if (config.preload) {
			client.forceToken().catch(() => {})
		}

		return client
	}	
}

export default Auth