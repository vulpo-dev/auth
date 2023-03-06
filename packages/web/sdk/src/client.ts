import {
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
    GenerateApiKey,
    GenerateApiKeyResponse,
    ApiKeys,
    UpdateEmailPayload,
    ConfirmUpdateEmailPayload,
    RejectUpdateEmailPayload,
    UserSetPasswordPayload,
    DeleteApiKeyPayload,
} from './types'

import { SessionService } from './session'
import { Session, IKeyStorage, OAuthState } from './storage'
import { Tokens } from './tokens'
import {
	ApiError,
	ErrorCode,
	SessionNotFoundError,
	SessionKeysNotFoundError,
    AuthError,
} from './error'
import { getPublicKey, ratPayload } from './keys'
import { getLanguages, IHttpService, uuid } from './utils'

export type ClientDep = {
	sessionService: SessionService,
	tokens: Tokens,
	httpService: IHttpService,
	projectId: string,
	keyStorage: IKeyStorage,
}

export type RequestConfig = Partial<Request>

export interface IAuthClient {
	setProject(id: string): void;
	signIn(email: string, password: string, config?: RequestConfig): Promise<User>;
	signUp(email: string, password: string, config?: RequestConfig): Promise<User>;
	signOut(sessionId?: string, config?: RequestConfig): Promise<unknown>;
	signOutAll(sessionId?: string, config?: RequestConfig): Promise<unknown>;
	getToken(sessionId?: string): Promise<string>;
	forceToken(sessionId?: string): Promise<string>;
	resetPassword(email: string, config?: RequestConfig): Promise<void>;
	setResetPassword(body: SetPasswordPayload, config?: RequestConfig): Promise<void>;
	setPassword(password: string, config?: RequestConfig): Promise<void>;
	verifyToken(id: string, token: string, config?: RequestConfig): Promise<void>;
	passwordless(email: string, config?: RequestConfig): Promise<{ id: string; session: string }>;
	confirmPasswordless(id: string, token: string, config?: RequestConfig): Promise<void>;
	verifyEmail(id: string, token: string, config?: RequestConfig): Promise<void>;
	verifyPasswordless(id: string, session: string, config?: RequestConfig): Promise<User | null>;
	authStateChange(cb: AuthCallback): Unsubscribe;
	activate(userId: string): void;
	readonly active: SessionInfo | null;
	withToken(fn: (token: string) => Promise<Response>, session?: string): Promise<Response>;
	flags(config?: RequestConfig): Promise<Array<Flag>>;
	getUser(): User | null;
	oAuthGetAuthorizeUrl(provider: 'google', config?: RequestConfig): Promise<string>;
	oAuthConfirm(csrf_token: string, code: string, config?: RequestConfig): Promise<[User | null, string]>;
	updateEmail(email: string, config?: RequestConfig): Promise<void>;
	confirmUpdateEmail(id: string, token: string, config?: RequestConfig): Promise<void>;
	rejectUpdateEmail(id: string, token: string, config?: RequestConfig): Promise<void>;
	generateApiKey(payload: GenerateApiKey, config?: RequestConfig): Promise<GenerateApiKeyResponse>;
	listApiKeys(config?: Partial<Request>): Promise<ApiKeys>;
	deleteApiKey(id: string, config?: Partial<Request>): Promise<void>
}

export class AuthClient implements IAuthClient {
	private sessionService: SessionService
	private tokens: Tokens
	private httpService: IHttpService
	private projectId: string
	private keyStorage: IKeyStorage
		
	constructor(dep: ClientDep) {
		this.sessionService = dep.sessionService
		this.tokens = dep.tokens
		this.httpService = dep.httpService
		this.projectId = dep.projectId
		this.keyStorage = dep.keyStorage
	}

	setProject(id: string): void {
		this.projectId = id    
	}

	private async emailPasswordAuth(
		url: Url.SignIn | Url.SignUp,
		email: string,
		password: string,
		config?: RequestConfig,
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

		let onError = async (err: ApiError) => {
			await this.sessionService.remove(session.id)
			return Promise.reject(err)
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
	 * ```html
	 *  <form id="signIn">
	 *      <section>
	 *          <label>Email</label>
	 *          <input name="email" type="email" />
	 *      </section>
	 * 
	 *      <section>
	 *          <label>Password</label>
	 *          <input name="password" type="password" />
	 *      </section>
	 *
	 *      <button>Sign In</button>
	 *  </form>
	 * 
	 *  <script>
	 *      let auth = Auth.create({ /\* config *\/})
	 *      let signIn = document.querySelector("#signIn")
	 * 		
	 *      signIn.addEventListener("submit", async (event) => {
	 *          event.preventDefault()
	 *  
	 *          let formData = new FormData(event.target)
	 *          let user = await auth.signIn(
	 *              formData.get("email"),
	 *              formData.get("password"),
	 *          )
	 *      })
	 *  </script>
	 * ```
	 * 
	 * @param email - The user email address
	 * @param password - The user password
 	 * @returns the user
	*/
	async signIn(email: string, password: string, config?: RequestConfig): Promise<User> {
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
	 * ```html
	 *  <form id="signUp">
	 *      <section>
	 *          <label>Email</label>
	 *          <input name="email" type="email" />
	 *      </section>
	 * 
	 *      <section>
	 *          <label>Password</label>
	 *          <input name="password" type="password" />
	 *      </section>
	 *
	 *      <button>Sign Up</button>
	 *  </form>
	 * 
	 *  <script>
	 *      let auth = Auth.create({ /\* config *\/})
	 *      let signUp = document.querySelector("#signUp")
	 * 		
	 *      signUp.addEventListener("submit", async (event) => {
	 *          event.preventDefault()
	 *  
	 *          let formData = new FormData(event.target)
	 *          let user = await auth.signUp(
	 *              formData.get("email"),
	 *              formData.get("password"),
	 *          )
	 *      })
	 *  </script>
	 * ```
	 * 
	 * @param email - The user email address
	 * @param password - The user password
	*/
	async signUp(email: string, password: string, config?: RequestConfig): Promise<User> {
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
		config?: RequestConfig,
	) {
		let session = sessionId ?? this.sessionService.active?.id

		if (!session) {
			return
		}

		let value = await this.sessionService.generateAccessToken(session, ratPayload())
		await this.sessionService.remove(session)
		let _url = url.replace(':session', session)
		return await this.httpService.post(_url, { value }, config)
	}

	/**
	 * Sign out a user from the current session
	 * 
	 * @param sessionId when sessionId is undefined, the currently active session will be used
	*/
	async signOut(sessionId?: string, config?: RequestConfig): Promise<unknown> {
		return await this.removeSession(Url.SignOut, sessionId, config)
	}

	/**
	 * Sign out a user from all sessions
	 * 
	 * @param sessionId when sessionId is undefined, the currently active session will be used
	*/
	async signOutAll(sessionId?: string, config?: RequestConfig): Promise<unknown> {
		return await this.removeSession(Url.SignOutAll, sessionId, config)
	}

	private async getAccessToken(
		fn: (session: Session) => Promise<string>,
		sessionId?: string,
	) {
		try {
			let info = this.sessionService.current(sessionId)
			if (!info) {
				throw new SessionNotFoundError();
			}

			let keys = await this.keyStorage.get(info.id)
			if (!keys) {
				throw new SessionKeysNotFoundError();
			}

			let session = { ...info, ...keys }
			return await fn(session)
		} catch (err) {
			if (this.sessionService.active && this.sessionService.active?.id === sessionId) {
				await this.sessionService.remove(this.sessionService.active?.id)
			}

			if (err instanceof SessionNotFoundError || err instanceof SessionKeysNotFoundError) {
				this.sessionService.setCurrent(null);
			}

			if (err instanceof AuthError && err.code === "session/expired") {
				this.sessionService.setCurrent(null);

				let activeSession = this.sessionService.current(sessionId);
				if (activeSession) {
					await this.sessionService.remove(activeSession.id);
				}
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
	async resetPassword(email: string, config?: RequestConfig): Promise<void> {
		let payload: PasswordResetPayload = { email }
		await this.httpService
			.post(Url.RequestPasswordReset, payload, config)
	}

	/**
	 * This method is use in combination with the {@link AuthClient.resetPassword} method, the generated link
	 * to reset your password contains a token id and the token value that will be used to
	 * reset the password
	 * 
	 * ```js
	 *   let params = new URLSearchParams(window.location.search)
	 *   
	 *   auth.setResetPassword({
	 *       id: params.get("id"),
	 *       token: params.get("token"),
	 *       password1: 'new-password',
	 *       password2: 'new-password',
	 *   })
	 * ```
	*/
	async setResetPassword(body: SetPasswordPayload, config?: RequestConfig): Promise<void> {
		await this.httpService
			.post(Url.PasswordReset, body, config)
	}

	/**
	 * Update a Users password
	*/
	async setPassword(password: string, config?: RequestConfig): Promise<void> {
		let currentSession = this.sessionService.current()
		
		if (!currentSession) {
			return
		}

		let accessToken = await this.getToken(currentSession.id)

		let headers = config?.headers ?? new Headers()
		headers.set('Authorization', `Bearer ${accessToken}`)

		let payload: UserSetPasswordPayload = { password }

		await this.httpService
			.post(Url.UserSetPassword, payload, {
				...config,
				headers,
			})


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
	 * 
	 * ```js
	 *   let params = new URLSearchParams(window.location.search)
	 *   
	 *   auth.verifyToken(
	 *       id: params.get("id"),
	 *       token: params.get("token"),
	 *   )
	 * ```
	*/
	async verifyToken(id: string, token: string, config?: RequestConfig): Promise<void> {
		let payload: VerifyResetTokenPayload = { id, token }
		await this.httpService
			.post(Url.VerifyResetToken, payload, config)
	}

	/**
	 * Create new session using an authentication link, if the user does not exits, a new
	 * user will be created
	*/
	async passwordless(email: string, config?: RequestConfig): Promise<{ id: string; session: string }> {
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
				return Promise.reject(err)
			})

		return { id: data.id, session: session.id }
	}

	/**
	 * This method is used in combination with the {@link AuthClient.passwordless} method and is used
	 * to confim the authentication link
	 * 
	 * ```js
	 *   let params = new URLSearchParams(window.location.search)
	 *   
	 *   auth.confirmPasswordless(
	 *       id: params.get("id"),
	 *       token: params.get("token"),
	 *   )
	 * ```
	*/
	async confirmPasswordless(id: string, token: string, config?: RequestConfig): Promise<void> {
		let payload: ConfirmPasswordlessPayload = { id, token }
		await this.httpService
			.post(Url.PasswordlessConfim, payload, config)
	}

	/**
	 * Verify a users email address
	 * 
	 * When the {@link Flag.VerifyEmail} flag is set, an email will be
	 * send to the user containing a link to verify the email.
	 * 
	 * ```js
	 *   let params = new URLSearchParams(window.location.search)
	 *   
	 *   auth.verifyEmail(
	 *       id: params.get("id"),
	 *       token: params.get("token"),
	 *   )
	*/
	async verifyEmail(id: string, token: string, config?: RequestConfig): Promise<void> {
		let payload: VerifyEmailPayload = { id, token }
		await this.httpService
			.post(Url.UserVerifyEmail, payload, config)
	}

	/**
	 * This method is used in combination witht the {@link AuthClient.passwordless} method, it polls the
	 * server for update and resolves the promise once the authentication link has been confirmed
	 * 
	 * ```js
	 *   let { id, session } = await auth.passwordless("email@vulpo.dev")
	 *   let user = await auth.verifyPasswordless(id, session)
	 * ```
	*/
	verifyPasswordless(id: string, session: string, config?: RequestConfig): Promise<User | null> {
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
				check().catch(async (error: ApiError) => {
					if (error.code === ErrorCode.PasswordlessAwaitConfirm) {
						setTimeout(loop, 1000)
					} else if (error.code === ErrorCode.AbortError) {
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
	 * 
	 * ```js
	 *   auth.authStateChange(session => {
	 *       // when session === undefined => loading
	 *       // when session === null => no session
	 *       // otherwise we have a valid {@link SessionInfo}
	 *   })
	 * ```
	*/
	authStateChange(cb: AuthCallback): Unsubscribe {
		let sub = this.sessionService.subscribe(cb)
		let session = this.sessionService.current(this.sessionService.active?.id)
		cb(session)
		return sub
	}

	/**
	 * The SDK supports multiple users, you can switch between user sessions 
	 * by calling `activate`
	*/
	activate(userId: string) {
		this.sessionService.activate(userId)
	}

	/**
	 * Get the current session information
	*/
	get active(): SessionInfo | null {
		return this.sessionService.active
	}

	/**
	 * `withToken` can be used to handle authenticated http calls, the callback will receive the
	 * current access token.
	 * When the request returns a `401`, a new access token will be requested and the request will
	 * be retried once.
	 * 
	 * ```js
	 *  let res = await auth.withToken(token => {
	 *      return fetch('api.your.app', {
	 *          headers: {
	 *              'Authorization': `Bearer ${token}`,
	 *          }
	 *      })
	 *  })
	 * ```
	*/
	async withToken<T extends Response>(fn: (token: string) => Promise<T>, session?: string): Promise<T> {
		let token = await this.getToken(session)

		return fn(token).then(async response => {
			if (response.status === 401) {
				let token = await this.forceToken(session)
				return fn(token).then(async response => {
		    		let { status } = response

		    		if (status === 401) {
		    			await this.signOut()
		    			return Promise.reject(new AuthError(ErrorCode.SessionExpired, response))
		    		}

		    		if (status > 400) {
		    			return Promise.reject(response)
		    		}

		    		return response
		    	})
			}

			return response
		})
	}

	/**
	 * get the currently active flags for a project
	*/
	async flags(config?: RequestConfig): Promise<Array<Flag>> {
		let url = Url.Flags.replace(':projectId', this.projectId)
		return this.httpService
			.get<{ items: Array<Flag> }>(url, config)
			.then(res => res.data.items)
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
	async oAuthGetAuthorizeUrl(provider: 'google', config?: RequestConfig): Promise<string> {
		let request_id = uuid()

		let payload: OAuthAuthorizeUrlPayload = {
			request_id
		}

		OAuthState.insert(provider, request_id)

		return this.httpService
			.post<OAuthAuthorizeUrlResponse>(`/oauth/${provider}/authorize_url`, payload, config)
			.then(res => res.url)
	}

	/**
	 * handle the OAuth callback and sign in the user if the
	 * code and csrf_token are valid
	 * 
	 * ```js
	 *  let params = new URLSearchParams(window.location.search)
	 *  auth.oAuthConfirm(params.get("state"), params.get("code"))
	 * ```
	*/
	async oAuthConfirm(csrf_token: string, code: string, config?: RequestConfig): Promise<[User | null, string]> {
		let oAuthState = OAuthState.get()

		if (!oAuthState) {
			return [null, '/']
		}

		let session = await this.sessionService.create()
		let public_key = await getPublicKey(session)

		let onError = async (res: ApiError) => {
			OAuthState.delete()
			await this.sessionService.remove(session.id)
			return Promise.reject(res)
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


	/*
	 * start the update email flow
	*/
	async updateEmail(new_email: string, config?: Partial<Request> | undefined): Promise<void> {
	    await this.withToken(token => {
	    	let headers = new Headers(config?.headers)
	    	headers.append('Authorization', `Bearer ${token}`)
	    	let payload: UpdateEmailPayload = { new_email }
	    	return this.httpService.post(Url.UpdateEmail, payload, { ...config, headers })
	    })
	}


	/*
	 * confirm the new email
	*/
	async confirmUpdateEmail(id: string, token: string, config?: Partial<Request> | undefined): Promise<void> {
		let payload: ConfirmUpdateEmailPayload = { id, token }
		await this.httpService.post(Url.ConfirmUpdateEmail, payload, config)
	}


	/*
	 * reject the new email
	*/
	async rejectUpdateEmail(id: string, token: string, config?: Partial<Request> | undefined): Promise<void> {
		let payload: RejectUpdateEmailPayload = { id, token }
		await this.httpService.post(Url.RejectUpdateEmail, payload, config)
	}


	/*
	 * generate a new API key
	*/
	async generateApiKey(payload: GenerateApiKey = {}, config?: RequestConfig): Promise<GenerateApiKeyResponse> {
		let { data } = await this.withToken(token => {
	    	let headers = new Headers(config?.headers)
	    	headers.append('Authorization', `Bearer ${token}`)
	    	return this.httpService
	    		.post<GenerateApiKeyResponse>(Url.GenerateApiKey, payload, { ...config, headers })
	    })

		return data
	}


	/*
	 * list all API keys for a user
	*/
	async listApiKeys(config?: Partial<Request> | undefined): Promise<ApiKeys> {
	    let res = await this.withToken(token => {
	    	let headers = new Headers(config?.headers)
	    	headers.append('Authorization', `Bearer ${token}`)
	    	return this.httpService.get<ApiKeys>(Url.ListApiKeys, { ...config, headers })
	    })

	    return res.data
	}


	/*
	 * delete API key
	*/
	async deleteApiKey(id: string, config?: Partial<Request> | undefined): Promise<void> {
	    await this.withToken(token => {
	    	let headers = new Headers(config?.headers)
	    	headers.append('Authorization', `Bearer ${token}`)
	    	let payload: DeleteApiKeyPayload = { id }
	    	return this.httpService.post(Url.DeleteApiKey, payload, { ...config, headers })
	    })
	}
}
