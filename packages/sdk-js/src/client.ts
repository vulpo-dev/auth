import type {
	TokenResponse,
	Config,
	AuthCallback,
	Unsubscribe,
	User,
	SessionResponse,
	CancellablePromise,
	SetPassword,
} from 'types'

import { Session } from 'session'
import { Tokens } from 'tokens'
import { ApiError, ErrorCode, ClientError } from 'error'
import { createSession, getPublicKey, generateAccessToken, ratPayload } from 'keys'
import { Sessions, Keys, SessionInfo } from 'storage'

import Axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

export const CancelToken = Axios.CancelToken;

export class AuthClient {
	private session: Session;
	private tokens: Tokens;
	private http: AxiosInstance;
	private error: ApiError = new ApiError();
		
	constructor(
		session: Session,
		tokens: Tokens,
		http: AxiosInstance,
	) {
		this.session = session
		this.tokens = tokens
		this.http = http
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

		let url = '/password/sign_in'
		let { data } = await this.http
			.post<SessionResponse>(url, payload, config)
			.catch(async res => {
				await Sessions.delete(session.id)
				return Promise.reject(this.error.fromResponse(res))
			})
		
		let user = await this.session.fromResponse(data)
		await this.session.activate(data.session)
		this.tokens.fromResponse(data)
		return user
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

		let url = '/password/sign_up'
		let { data } = await this.http
			.post<SessionResponse>(url, payload, config)
			.catch(async res => {
				await Sessions.delete(session.id)
				return Promise.reject(this.error.fromResponse(res))
			})

		let user = await this.session.fromResponse(data)
		await this.session.activate(data.session)
		this.tokens.fromResponse(data)
		return user
	}

	async signOut(sessionId?: string, config?: AxiosRequestConfig): Promise<void> {
		let session = sessionId ?? this.session.active?.id

		if (!session) {
			return
		}

		let value = await generateAccessToken(session, ratPayload())
		await this.http
			.post(`user/sign_out/${session}/`, { value }, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))

		await this.session.remove(session)
	}

	async signOutAll(sessionId?: string, config?: AxiosRequestConfig): Promise<void> {
		let session = sessionId ?? this.session.active?.id

		if (!session) {
			return
		}

		let value = await generateAccessToken(session, ratPayload())
		await this.http
			.post(`user/sign_out_all/${session}/`, undefined, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))

		await this.session.remove(session)
	}

	async getToken(sessionId?: string): Promise<string | null> {
		try {

			let info = await this.session.current(sessionId)
			if (!info) {
				return null
			}

			let keys = await Keys.get(info.id)
			if (!keys) {
				this.session.setCurrent(null)
				return null
			}

			let session = { ...info, ...keys }
			return await this.tokens.getToken(session)
		} catch (res) {
			let err = res instanceof ClientError
				? res
				: this.error.fromResponse(res)

			if (sessionId === undefined) {
				this.session.setCurrent(null)
			}

			throw err
		}
	}

	async resetPassword(email: string, config?: AxiosRequestConfig): Promise<void> {
		await this.http
			.post('/password/request_password_reset', { email }, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	async setPassword(body: SetPassword, config?: AxiosRequestConfig): Promise<void> {
		await this.http
			.post('/password/password_reset', body, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	async verifyToken(id: string, token: string, config?: AxiosRequestConfig): Promise<void> {
		await this.http
			.post('/password/verify_reset_token', { id, token }, config)
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
			.post<{ id: string }>('/passwordless/', payload, config)
			.catch(async err => {
				await Sessions.delete(session.id)
				return Promise.reject(this.error.fromResponse(err))
			})

		return { id: data.id, session: session.id }
	}

	async confirmPasswordless(id: string, token: string, config?: AxiosRequestConfig): Promise<void> {
		await this.http
			.post('/passwordless/confirm', { id, token }, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	async verifyEmail(id: string, token: string, config?: AxiosRequestConfig): Promise<void> {
		await this.http
			.post('/user/verify_email', { id, token }, config)
			.catch(err => Promise.reject(this.error.fromResponse(err)))
	}

	verifyPasswordless(id: string, session: string, config?: AxiosRequestConfig): Promise<User | null> {
		return new Promise((resolve, reject) => {
			let check = async () => {
				let { data } = await this.http.get<SessionResponse>('/passwordless/verify', {
					...config,
					params: { token: id, session },
				})

				this.tokens.fromResponse(data)
				let user = await this.session.fromResponse(data)

				this.session.activate(data.session)
				resolve(user)
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
}

export let Auth = {
	create(config: Config): AuthClient {

		let http = Axios.create({
			baseURL: config.baseURL,
			headers: {
				'Bento-Project': config.project
			}
		})

		let user = new Session(config)
		let tokens = new Tokens(user, http)

		let client = new AuthClient(
			user,
			tokens,
			http,
		)

		return client
	}	
}

export default Auth