import type {
	TokenResponse,
	Config,
	AuthCallback,
	Unsubscribe,
	User as IUser
} from 'types'

import { User as User } from 'user'
import { Tokens } from 'tokens'
import { ApiError, ErrorCode } from 'error'

import Axios, { AxiosInstance } from 'axios'
import { shallowEqualObjects } from 'shallow-equal'

let DefaultConfig: Config =
	{ offline: true
	, project: ''
	, baseURL: ''
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

	async signIn(email: string, password: string): Promise<IUser> {
		let url = '/password/sign_in'
		let { data } = await this.http
			.post<TokenResponse>(url, { email, password })
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

	async signUp(email: string, password: string): Promise<IUser> {
		let url = '/password/sign_up'
		let { data } = await this.http
			.post<TokenResponse>(url, { email, password })
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

	async signOut(userId?: string): Promise<void> {
		let id = userId ?? this.user.active

		if (!id) {
			return
		}

		try {
			this.user.remove(id)
			await this.http.post(`user/sign_out/${id}`)
		} catch (err) {
			throw this.error.fromResponse(err)
		}
	}

	async signOutAll(userId?: string): Promise<void> {
		let id = userId ?? this.user.active

		if (!id) {
			return
		}

		try {
			this.user.remove(id)
			await this.http.post(`user/sign_out_all/${id}`)
		} catch (err) {
			throw this.error.fromResponse(err)
		}
	}

	async getToken(userId?: string): Promise<string | null> {
		try {
			return await this.tokens.getToken(userId)
		} catch (res) {
			let err = this.error.fromResponse(res)
			
			if ( err.code === ErrorCode.AuthRefreshTokenMissing ||
				 err.code === ErrorCode.AuthRefreshTokenNotFound ||
				 err.code === ErrorCode.AuthRefreshTokenInvalidFormat
			   ) {
				this.user.setCurrent(null)
			}

			throw err
		}
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

export let Auth = {
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

		// Prefetch the token
		client
			.getToken()
			.catch(err => {})

		return client
	}	
}

export default Auth