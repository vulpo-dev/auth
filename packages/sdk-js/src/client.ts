import type {
		User
	, TokenResponse
	, $Config
	, UserState
	, AuthCallback
	, Unsubscribe
	, PasswordOptions
	, Token
	, TokenListener
} from './types'

import { makeId, getUsers, last } from './utils'
import { ApiError } from './types'
import Storage from './storage'

import { ResultAsync, errAsync, okAsync } from 'neverthrow'
import Axios, { AxiosStatic } from 'axios'
import { shallowEqualObjects } from 'shallow-equal'

let DefaultConfig: $Config =
	{ offline: true
	, project: ''
	, baseURL: ''
	}

let DefaultOptions: PasswordOptions =
	{ remember: true
	}

type $AuthClient =
	{ signIn: (email: string, password: string, options?: PasswordOptions) => Promise<ResultAsync<User | undefined, ApiError>>
	, signUp: (email: string, password: string, options?: PasswordOptions) => Promise<ResultAsync<User | undefined, ApiError>>
	, signOut: () => Promise<ResultAsync<void, ApiError>>
	, authStateChange: (cb: AuthCallback) => Unsubscribe
	, getToken: () => Promise<string | null>
	, config: $Config
	
	, _getId: () => number
	, _http: AxiosStatic
	
	, _user: UserState
	, users: Array<User>
	, _listener: Array<{ id: number, cb: AuthCallback }>
	, _userCallback: (token: TokenResponse) => User | undefined
	, active: string
	, activate: (userId: string) => void

	, _tokens: Array<Token>
	, _inFlight: Promise<string | null> | null
	, _tokenListener: Array<{ resolve: (token: string | null) => void; reject: (err: any) => any}>
	, _getToken: () => void
	, _tokenExpire: Date
	, _handleToken: (token: TokenResponse) => void

	}

let AuthClient: $AuthClient =
	{ config: DefaultConfig
	, _getId: () => 0
	, _listener: []
	, _user: undefined
	, _http: Axios
	, _tokens: []
	, _inFlight: null
	, _tokenListener: []
	, _tokenExpire: new Date()
	, active: ''
	, users: []

	, async signIn(email: string, password: string): Promise<ResultAsync<User | undefined, ApiError>> {
			let url = '/password/sign_in'
			let { data } = await this._http.post<TokenResponse>(url, { email, password })
			this._handleToken(data)
			let id = last(data.users)
			this.active = id ? id : ''
			Storage.setActive(id)
			let user = this._userCallback(data)
			return okAsync(user)
		}

	, async signUp(email: string, password: string): Promise<ResultAsync<User | undefined, ApiError>> {
			let url = '/password/sign_up'
			let { data } = await this._http.post<TokenResponse>(url, { email, password })
			this._handleToken(data)
			let id = last(data.users)
			this.active = id ? id : ''
			Storage.setActive(id)
			let user = this._userCallback(data)
			return okAsync(user)
		}

	, async signOut(): Promise<ResultAsync<void, ApiError>> {
			Storage.remove()
			return errAsync(ApiError.InternalServerError)
		}

	, async getToken(): Promise<string | null> {
			let now = new Date()
			let expired = this._tokenExpire < now

			if (this._inFlight !== null) {
				return this._inFlight
			}

			if (this._tokens.length === 0 || expired) {
				this._inFlight = new Promise<string | null>((resolve, reject) => {
					this._tokenListener.push({ resolve, reject })
				})

				this._getToken()

				return this._inFlight
			}

			let index = this.users.findIndex(user => {
				return this.active === user.id
			})

			let token = this._tokens[index]

			if (!token) {
				return null
			} 

			return token.access_token
		}

	, async _getToken(): Promise<void> {
			let { data } = await this._http.post<TokenResponse>('/token/refresh')
	
			this._tokenListener.forEach(promise => {
				let index = this.users.findIndex(user => {
					return this.active === user.id
				})

				let token = data.tokens[index]

				if (!token) {
					promise.resolve(null)
				} else {
					promise.resolve(token.access_token)
				}
			})

			this._tokenListener = []
			this._inFlight = null

			this._handleToken(data)
			this._userCallback(data)
		}

	, authStateChange(cb) {
			let id = this._getId()
			this._listener.push({ id, cb })

			let user = this.users.find(user => {
				return user.id === this.active
			})

			cb(user)

			return () => {
				this._listener = this
					._listener
					.filter(entry => entry.id !== id)
			}
		}

	, activate(userId: string) {
			this.active = userId

			let user = this.users.find(user => {
				return user.id === this.active
			})

			if (!shallowEqualObjects(this._user, user)) {
				this._user = user
				this._listener.forEach(entry => {
					entry.cb(user)
				})
 			}

			Storage.setActive(userId)
		}

	, _userCallback(data: TokenResponse): User | undefined {
			let users = getUsers(data.tokens)
			this.users = users

			if (this.config.offline) {
				Storage.insert(users)
			}

			let user = users.find(user => {
				return user.id === this.active
			})

			if (!shallowEqualObjects(this._user, user)) {
				this._listener.forEach(entry => {
					entry.cb(user)
				})
 			}

 			return user
		}

	, _handleToken({ tokens }: TokenResponse) {
			this._tokens = tokens

			let [token] = tokens

			let expire_in = token ? token.expire_in : 0

			let threshold = 30
			let expires_in = new Date()
			expires_in.setSeconds(
				expires_in.getSeconds() + expire_in - threshold
			)

			this._tokenExpire = expires_in	
		}
	}

export let Auth = {
	create(userConfig: $Config): $AuthClient {
		let config = { ...DefaultConfig, ...userConfig }
		let _getId = makeId()
		
		let _http = Axios.create(
			{ baseURL: config.baseURL
			, headers:
					{ 'Bento-Project': config.project
					}
			, withCredentials: true
			}
		)

		let active = Storage.getActive()
		let userEntrys = Storage.get()
		let users = userEntrys ? userEntrys : []
		let _user = active === '' ? userEntrys[0] : userEntrys.find(user => {
			return user.id === active
		})

		let client = Object.assign(
				Object.create(AuthClient)
			, { config, _getId, _http, users, _user, active }
		)

		client.getToken()
			.catch(() => {})

		return client
	}	
}

export default Auth