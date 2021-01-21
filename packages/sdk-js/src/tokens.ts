import type {
	Token,
	TokenResponse
} from 'types'

import { User } from 'user'
import { AxiosInstance } from 'axios'

type InFlight = Promise<string | null> | null

type TokenPromise = {
	resolve: (token: string | null) => void;
	reject: (err: any) => any
}

export class Tokens {
	tokens: Map<string, Token> = new Map();

	private expireIn: Date = new Date()
	private listener: Array<TokenPromise> = [];
	private inFlight: InFlight = null;
	private user: User;
	private http: AxiosInstance;

	constructor(user: User, http: AxiosInstance) {
		this.user = user
		this.http = http
	}

	async getToken(): Promise<string | null> {
		/*
		 * this means that we are already doing a call
		 * to get a new access token, inFlight is holding
		 * the promise that will be resolved once the
		 * token call resolves/rejects
		*/
		if (this.inFlight !== null) {
			return this.inFlight
		}

		let now = new Date()
		let expired = this.expireIn < now
		if (this.tokens.size === 0 || expired) {
			this.inFlight = new Promise<string | null>((resolve, reject) => {
				this.listener.push({ resolve, reject })
			})

			this._getToken().catch(err => {
				this.listener.forEach(promise => {
					promise.reject(err)
				})
				this.listener = []
				this.inFlight = null
			})

			return this.inFlight
		}

		let token = this.tokens.get(this.user.active ?? '')

		if (!token) {
			return null
		} 

		return token.access_token
	}

	private async _getToken(): Promise<void> {
		let { data } = await this.http.post<TokenResponse>('/token/refresh')

		this.listener.forEach(promise => {
			let index = this.user.users.findIndex(user => {
				return this.user.active === user.id
			})

			let token = data.tokens[index]

			if (!token) {
				promise.resolve(null)
			} else {
				promise.resolve(token.access_token)
			}
		})

		this.listener = []
		this.inFlight = null

		this.fromResponse(data)
		this.user.fromResponse(data)
	}

	fromResponse({ tokens, users }: TokenResponse) {
		users.forEach((id, index) => {
			let token = tokens[index]
			this.tokens.set(id, token)
		})

		let [token] = tokens

		let expireIn = token ? token.expires_in : 0

		let threshold = 30 //seconds
		let expiresIn = new Date()
		let now = expiresIn.getSeconds()
		let expire = now + expireIn - threshold
		expiresIn.setSeconds(expire)
		this.expireIn = expiresIn	
	}
}