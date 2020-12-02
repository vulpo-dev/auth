import type {
		User
	, TokenResponse
	, $Config
	, UserState
	, AuthCallback
	, Unsubscribe
	, PasswordOptions
} from './types'

import { makeId, getUser } from './utils'
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
	{ signIn: (email: string, password: string, options?: PasswordOptions) => Promise<ResultAsync<User, ApiError>>
	, signUp: (email: string, password: string, options?: PasswordOptions) => Promise<ResultAsync<User, ApiError>>
	, signOut: () => Promise<ResultAsync<void, ApiError>>
	, authStateChange: (cb: AuthCallback) => Unsubscribe
	, getToken: () => Promise<String>
	, config: $Config
	, _listener: Array<{ id: number, cb: AuthCallback }>
	, _getId: () => number
	, _user: UserState
	, _http: AxiosStatic
	, _token: TokenResponse | null
	, _inFlight: Promise<String> | null
	, _tokenListener: Array<{ resolve: (token: TokenResponse) => void; reject: (err: any) => any}>
	, _getToken: () => void
	, _userCallback: (token: TokenResponse) => User 
	}

let AuthClient: $AuthClient =
	{ config: DefaultConfig
	, _getId: () => 0
	, _listener: []
	, _user: undefined
	, _http: Axios
	, _token: null
	, _inFlight: null
	, _tokenListener: []

	, async signIn(email: string, password: string): Promise<ResultAsync<User, ApiError>> {
			let url = '/password/sign_in'
			let { data } = await this._http.post<TokenResponse>(url, { email, password })
			this._token = data
			let user = this._userCallback(data)
			return okAsync(user)
		}

	, async signUp(email: string, password: string): Promise<ResultAsync<User, ApiError>> {
			let url = '/password/sign_up'
			let { data } = await this._http.post<TokenResponse>(url, { email, password })
			this._token = data
			let user = this._userCallback(data)
			return okAsync(user)
		}

	, async signOut(): Promise<ResultAsync<void, ApiError>> {
			Storage.remove()
			return errAsync(ApiError.InternalServerError)
		}

	, async getToken(): Promise<String> {

			if (this._inFlight !== null) {
				return this._inFlight
			}

			if (this._token === null) {
				this._inFlight = new Promise((resolve, reject) => {
					this._tokenListener.push({ resolve, reject })
				})

				this._getToken()

				return this._inFlight
			}

			return this._token.access_token
		}

	, async _getToken(): Promise<void> {
			let { data } = await this._http.post<TokenResponse>('/token/refresh')
			
			this._token = data

			this._tokenListener.forEach(promise => {
				promise.resolve(data.access_token)
			})

			this._tokenListener = []
			this._inFlight = false

			this._userCallback(data)
		}

	, _userCallback(data: TokenResponse): User {
			let user = getUser(data.access_token)

			if (this.config.offline) {
				Storage.insert(user)
			}

			if (!shallowEqualObjects(this._user, user)) {
				this._listener.forEach(entry => {
					entry.cb(user)
				})
 			}

 			return user
		}

	, authStateChange(cb) {
			let id = this._getId()
			this._listener.push({ id, cb })

			cb(this._user)

			return () => {
				this._listener = this
					._listener
					.filter(entry => entry.id !== id)
			}
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

		let userEntry = Storage.get()
		let _user = userEntry ? userEntry : undefined

		let client = Object.assign(
				Object.create(AuthClient)
			, { config, _getId, _http, _user }
		)

		client.getToken()
			.catch(() => {})

		return client
	}	
}

export default Auth