import type {
	Token,
	TokenResponse
} from 'types'

import { User } from 'user'
import { AxiosInstance } from 'axios'
import { ClientError } from 'error'

type InFlight = Promise<string | null>

type TokenPromise = {
	resolve: (token: string | null) => void;
	reject: (err: any) => any
}

export class Tokens {
	tokens: Map<string, Token> = new Map();

	private expireIn: Map<string, Date> = new Map()
	private listener: Map<string, TokenPromise> = new Map();
	private inFlight: Map<string, InFlight> = new Map();
	private user: User;
	private http: AxiosInstance;
	private created_at: Date = new Date()

	constructor(user: User, http: AxiosInstance) {
		this.user = user
		this.http = http
	}

	async getToken(userId: string | null = this.user.active): Promise<string | null> {
		
		if (!userId) {
			throw new ClientError()
			return null
		}

		/*
		 * this means that we are already doing a call
		 * to get a new access token, inFlight is holding
		 * the promise that will be resolved once the
		 * token call resolves/rejects
		*/
		let inFlight = this.inFlight.get(userId)
		if (!!inFlight) {
			return inFlight
		}


		let now = new Date()
		let expireIn = this.expireIn.has(userId)
			? this.expireIn.get(userId)
			: this.created_at

		let expired = expireIn! < now
		if (this.tokens.size === 0 || expired) {
			let promise = new Promise<string | null>((resolve, reject) => {
				this.listener.set(userId, { resolve, reject })
			})

			this.inFlight.set(userId, promise)

			this._getToken(userId).catch(err => {
				let promise = this.listener.get(userId)

				if (promise) {
					promise.reject(err)
				}

				this.listener.delete(userId)
				this.inFlight.delete(userId)
			})

			return promise
		}

		let token = this.tokens.get(this.user.active ?? '')

		if (!token) {
			return null
		} 

		return token.access_token
	}

	private async _getToken(userId: string): Promise<void> {
		let { data } = await this.http.post<TokenResponse>(`/token/refresh/${userId}`)
		let promise = this.listener.get(userId)
			
		if (promise) {
			if (data.token) {
				promise.resolve(data.token.access_token)
			} else {
				promise.resolve(null)
			}
		}

		this.listener.delete(userId)
		this.inFlight.delete(userId)

		this.fromResponse(data)
		this.user.fromResponse(data)
	}

	fromResponse({ token, user_id }: TokenResponse) {
		this.tokens.set(user_id, token)

		let expireIn = token ? token.expires_in : 0

		let threshold = 30 //seconds
		let expiresIn = new Date()
		let now = expiresIn.getSeconds()
		let expire = now + expireIn - threshold
		expiresIn.setSeconds(expire)
		this.expireIn.set(user_id, expiresIn)	
	}
}