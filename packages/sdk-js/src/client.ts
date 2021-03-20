import {
	TokenResponse,
	Config,
	AuthCallback,
	Unsubscribe,
	User,
	SessionResponse,
	CancellablePromise,
	SetPassword,
	Url,
	Flag,
	SessionInfo,
} from 'types'

import { Session } from 'session'
import { Tokens } from 'tokens'
import {
	ApiError,
	ErrorCode,
	ClientError,
	SessionNotFoundError,
	SessionKeysNotFoundError,
	ErrorResponse,
} from 'error'
import { createSession, getPublicKey, generateAccessToken, ratPayload } from 'keys'
import { Sessions, Keys } from 'storage'

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

	async signIn(email: string, password: string, config?: AxiosRequestConfig): Promise<User> {
		let session = await createSession()
		let public_key = await getPublicKey(session)

		let payload =  {
			email,
			password,
			public_key, 
			session: session.id,
		}

		let onError = async (res: AxiosError<ErrorResponse>) => {
			await Sessions.delete(session.id)
			return Promise.reject(this.error.fromResponse(res))
		}

		let { data } = await this.http
			.post<SessionResponse>(Url.SignIn, payload, config)
			.catch(onError)
		
		let { user } = await this.session
			.fromResponse(data)
			.catch(onError)

		await this.session.activate(data.session)
		this.tokens.fromResponse(data)
		return user!
	}

	async signUp(email: string, password: string, config?: AxiosRequestConfig): Promise<User> {
		let session = await createSession()
		let public_key = await getPublicKey(session)

		let payload =  {
			email,
			password,
			public_key, 
			session: session.id,
		}

		let onError = async (res: AxiosError<ErrorResponse>) => {
			await Sessions.delete(session.id)
			return Promise.reject(this.error.fromResponse(res))
		}

		let { data } = await this.http
			.post<SessionResponse>(Url.SignUp, payload, config)
			.catch(onError)

		let { user } = await this.session
			.fromResponse(data)
			.catch(onError)

		await this.session.activate(data.session)
		this.tokens.fromResponse(data)
		return user!
	}

	async signOut(sessionId?: string, config?: AxiosRequestConfig): Promise<void> {
		let session = sessionId ?? this.session.active?.id

		if (!session) {
			return
		}

		let value = await generateAccessToken(session, ratPayload())
		await this.session.remove(session)
		let url = Url.SignOut.replace(':session', session)
		await this.http
			.post(url, { value }, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	async signOutAll(sessionId?: string, config?: AxiosRequestConfig): Promise<void> {
		let session = sessionId ?? this.session.active?.id

		if (!session) {
			return
		}

		let value = await generateAccessToken(session, ratPayload())
		await this.session.remove(session)
		let url = Url.SignOutAll.replace(':session', session)
		await this.http
			.post(url, undefined, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	async getToken(sessionId?: string): Promise<string> {
		try {

			let info = await this.session.current(sessionId)
			if (!info) {
				return Promise.reject(new SessionNotFoundError())
			}

			let keys = await Keys.get(info.id)
			if (!keys) {
				this.session.setCurrent(null)
				return Promise.reject(new SessionKeysNotFoundError())
			}

			let session = { ...info, ...keys }
			return await this.tokens.getToken(session)
		} catch (res) {
			let err = res instanceof ClientError
				? res
				: this.error.fromResponse(res)

			throw err
		}
	}

	async forceToken(sessionId?: string): Promise<string> {
		try {

			let info = await this.session.current(sessionId)
			if (!info) {
				return Promise.reject(new SessionNotFoundError())
			}

			let keys = await Keys.get(info.id)
			if (!keys) {
				this.session.setCurrent(null)
				return Promise.reject(new SessionKeysNotFoundError())
			}

			let session = { ...info, ...keys }
			return await this.tokens.forceToken(session)
		} catch (res) {
			let err = res instanceof ClientError
				? res
				: this.error.fromResponse(res)

			throw err
		}
	}

	async resetPassword(email: string, config?: AxiosRequestConfig): Promise<void> {
		await this.http
			.post(Url.RequestPasswordReset, { email }, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	async setPassword(body: SetPassword, config?: AxiosRequestConfig): Promise<void> {
		await this.http
			.post(Url.PasswordReset, body, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	async verifyToken(id: string, token: string, config?: AxiosRequestConfig): Promise<void> {
		await this.http
			.post(Url.VerifyResetToken, { id, token }, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	async passwordless(email: string, config?: AxiosRequestConfig): Promise<{ id: string; session: string }> {
		let session = await createSession()
		let public_key = await getPublicKey(session)

		let payload =  {
			email,
			public_key, 
			session: session.id,
		}

		let { data } = await this.http
			.post<{ id: string }>(Url.Passwordless, payload, config)
			.catch(async err => {
				await Sessions.delete(session.id)
				return Promise.reject(this.error.fromResponse(err))
			})

		return { id: data.id, session: session.id }
	}

	async confirmPasswordless(id: string, token: string, config?: AxiosRequestConfig): Promise<void> {
		await this.http
			.post(Url.PasswordlessConfim, { id, token }, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	async verifyEmail(id: string, token: string, config?: AxiosRequestConfig): Promise<void> {
		await this.http
			.post(Url.UserVerifyEmail, { id, token }, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	verifyPasswordless(id: string, session: string, config?: AxiosRequestConfig): Promise<User | null> {
		return new Promise((resolve, reject) => {
			let check = async () => {
				let { data } = await this.http.get<SessionResponse>(Url.PasswordlessVerify, {
					...config,
					params: { token: id, session },
				})

				this.tokens.fromResponse(data)
				let { user } = await this.session.fromResponse(data)

				this.session.activate(data.session)
				resolve(user!)
			}

			check().catch(async err => {
				let error = this.error.fromResponse(err)
				if (error.code === ErrorCode.PasswordlessAwaitConfirm) {
					setTimeout(check, 1000)
				} else if (Axios.isCancel(err)) {
					resolve(null)
				} else {
					await Sessions.delete(session)
					reject(error)
				}
			})
		})
	}

	authStateChange(cb: AuthCallback): Unsubscribe {
		let sub = this.session.subscribe(cb)
		let session = this.session.current(this.session.active?.id)
		cb(session)
		return sub
	}

	activate(userId: string) {
		this.session.activate(userId)
	}

	get active(): SessionInfo | null {
		return this.session.active
	}

	async withToken(fn: (token: string) => Promise<Response>, session?: string): Promise<Response> {
		let token = await this.getToken(session)

		return fn(token).then(async response => {
			if (response.status === 401) {
				let token = await this.forceToken(session)
				return fn(token)
			}

			return response
		})
	}

	async flags(config?: AxiosRequestConfig): Promise<Array<Flag>> {
		return this.http
			.get<{ items: Array<Flag> }>(`${Url.Flags}?project=${this.config.project}`, config)
			.then(res => res.data.items)
	}

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
			client.forceToken().catch(err => {})
		}

		return client
	}	
}

export default Auth