import type {
	TokenResponse,
	Config,
	AuthCallback,
	Unsubscribe,
	User as IUser
} from 'types'

import { User as User } from 'user'
import { Tokens } from 'tokens'
import { ApiError, ErrorCode, ClientError } from 'error'

import Axios, { AxiosInstance, AxiosRequestConfig} from 'axios'
import { shallowEqualObjects } from 'shallow-equal'

export const CancelToken = Axios.CancelToken;

interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void
}

export type SetPassword = {
	id: string;
	token: string;
	password1: string;
	password2: string;
}

let DefaultConfig: Config = {
	offline: true,
	project: '',
	baseURL: '',
	preload: true,
}

export class AuthClient {
	config: Config = DefaultConfig;

	private user: User;
	private tokens: Tokens;
	private http: AxiosInstance;
	private error: ApiError = new ApiError();
		
	constructor(
		user: User,
		tokens: Tokens,
		http: AxiosInstance,
		config: Config
	) {
		this.user = user
		this.tokens = tokens
		this.http = http
		this.config = config
	}

	async signIn(email: string, password: string, config?: AxiosRequestConfig): Promise<IUser> {
		let url = '/password/sign_in'
		let { data } = await this.http
			.post<TokenResponse>(url, { email, password }, config)
			.catch(res => Promise.reject(this.error.fromResponse(res)))
		
		this.tokens.fromResponse(data)
		let user = this.user.fromResponse(data)

		// todo: proper error handling
		if (user === undefined) {
			throw new Error('signIn')
		}

		this.user.activate(user.id)
		return user
	}

	async signUp(email: string, password: string, config?: AxiosRequestConfig): Promise<IUser> {
		let url = '/password/sign_up'
		let { data } = await this.http
			.post<TokenResponse>(url, { email, password }, config)
			.catch(res => Promise.reject(this.error.fromResponse(res)))

		this.tokens.fromResponse(data)
		let user = this.user.fromResponse(data)

		// todo: proper error handling
		if (user === undefined) {
			throw new Error('signIn')
		}

		this.user.activate(user.id)
		return user
	}

	async signOut(userId?: string, config?: AxiosRequestConfig): Promise<void> {
		let id = userId ?? this.user.active

		if (!id) {
			return
		}

		try {
			this.user.remove(id)
			await this.http.post(`user/sign_out/${id}`, undefined, config)
		} catch (err) {
			throw this.error.fromResponse(err)
		}
	}

	async signOutAll(userId?: string, config?: AxiosRequestConfig): Promise<void> {
		let id = userId ?? this.user.active

		if (!id) {
			return
		}

		try {
			this.user.remove(id)
			await this.http.post(`user/sign_out_all/${id}`, undefined, config)
		} catch (err) {
			throw this.error.fromResponse(err)
		}
	}

	async getToken(userId?: string): Promise<string | null> {
		try {
			return await this.tokens.getToken(userId)
		} catch (res) {
			let err = res instanceof ClientError
				? res
				: this.error.fromResponse(res)

			if ( err.code === ErrorCode.AuthRefreshTokenMissing ||
				 err.code === ErrorCode.AuthRefreshTokenNotFound ||
				 err.code === ErrorCode.AuthRefreshTokenInvalidFormat ||
				 err.code === ErrorCode.ClientUserIdNotFound ||
				 err.code === ErrorCode.NotFound || 
				 err.code === ErrorCode.GenericError
			   ) {
				this.user.setCurrent(null)
			}

			throw err
		}
	}

	async resetPassword(email: string, config?: AxiosRequestConfig): Promise<void> {
		try {
			await this.http.post('/password/request_password_reset', { email }, config)
		} catch(err) {
			throw this.error.fromResponse(err)
		}
	}

	async setPassword(body: SetPassword, config?: AxiosRequestConfig): Promise<void> {
		try {
			await this.http.post('/password/password_reset', body, config)
		} catch (err) {
			throw this.error.fromResponse(err)
		}
	}

	async verifyToken(id: string, token: string, config?: AxiosRequestConfig): Promise<void> {
		try {
			await this.http.post('/password/verify_reset_token', { id, token }, config)
		} catch (err) {
			throw this.error.fromResponse(err)
		}
	}

	async passwordless(email: string, config?: AxiosRequestConfig): Promise<string> {
		try {
			let res = await this.http.post<[string]>('/passwordless/', { email }, config)
			return res.data[0]!
		} catch (err) {
			throw this.error.fromResponse(err)
		}
	}

	async confirmPasswordless(id: string, token: string, config?: AxiosRequestConfig): Promise<void> {
		try {
			await this.http.post('/passwordless/confirm', { id, token }, config)
		} catch (err) {
			throw this.error.fromResponse(err)
		}
	}

	async verifyEmail(id: string, token: string, config?: AxiosRequestConfig): Promise<void> {
		try {
			await this.http.post('/user/verify_email', { id, token }, config)
		} catch (err) {
			throw this.error.fromResponse(err)
		}
	}

	verifyPasswordless(id: string, config?: AxiosRequestConfig): Promise<IUser | null> {
		return new Promise((resolve, reject) => {
			let check = async () => {
				try {
					
					let { data } = await this.http.get<TokenResponse>('/passwordless/verify', {
						...config,
						params: { token: id },
					})

					this.tokens.fromResponse(data)
					let user = this.user.fromResponse(data)

					// todo: proper error handling
					if (user === undefined) {
						throw new Error('signIn')
					}

					this.user.activate(user.id)
					resolve(user)
				} catch (err) {
					let error = this.error.fromResponse(err)
					if (error.code === ErrorCode.PasswordlessAwaitConfirm) {
						setTimeout(check, 1000)
					} else if (Axios.isCancel(err)) {
						resolve(null)
					} else {
						reject(error)
					}
				}
			}

			check()
		})
	}

	authStateChange(cb: AuthCallback): Unsubscribe {
		let sub = this.user.subscribe(cb)
		cb(this.user.current)
		return sub
	}

	activate(userId: string) {
		this.user.activate(userId)
	}

	get active() {
		return this.user.active
	}
}

type $Auth = {
	create(userConfig: Config): AuthClient;
}

export let Auth: $Auth = {
	create(userConfig: Config): AuthClient {
		let config = { ...DefaultConfig, ...userConfig }
		
		let http = Axios.create({
			baseURL: config.baseURL,
			headers: {
				'Bento-Project': config.project
			},
			withCredentials: true
		})

		let user = new User(config)
		let tokens = new Tokens(user, http)

		let client = new AuthClient(
			user,
			tokens,
			http,
			config,
		)

		if (config.preload) {			
			client
				.getToken()
				.catch(err => {})
		}

		return client
	}	
}

export default Auth