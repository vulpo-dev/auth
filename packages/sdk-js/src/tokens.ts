import type {
	Token,
	SessionResponse,
	SessionId,
	AccessToken,
} from 'types'

import { Session as SessionEntry } from 'storage'
import { generateAccessToken, ratPayload } from 'keys'
import { Session } from 'session'
import { AxiosInstance } from 'axios'
import { ClientError } from 'error'

type InFlight = Promise<string | null>

type TokenPromise = {
	resolve: (token: string | null) => void;
	reject: (err: any) => any
}

export class Tokens {
	tokens: Map<SessionId, AccessToken> = new Map();

	private expireIn: Map<SessionId, Date> = new Map()
	private inFlight: Map<SessionId, InFlight> = new Map();
	private session: Session;
	private http: AxiosInstance;
	private created_at: Date = new Date()

	constructor(session: Session, http: AxiosInstance) {
		this.session = session
		this.http = http
	}

	async getToken(session: SessionEntry): Promise<AccessToken | null> {
		let inFlight = this.inFlight.get(session.id)
		if (inFlight !== undefined) {
			return inFlight
		}

		let now = new Date()
		let expireIn = this.expireIn.has(session.id)
			? this.expireIn.get(session.id)
			: this.created_at

		let expired = expireIn! < now
		let token = this.tokens.get(session.id)
		
		if (expired || !token) {
			let promise = this._getToken(session)
			this.inFlight.set(session.id, promise)
			return promise
		}

		return token
	}

	private async _getToken(session: SessionEntry): Promise<AccessToken | null> {
		let value = await generateAccessToken(session.id, ratPayload())

		try {
			let { data } = await this.http.post<SessionResponse>(`/token/refresh/${session.id}`, { value })
			this.fromResponse(data)
			this.session.fromResponse(data)
			return data.access_token
		} catch(err) {
			return null
		} finally {
			this.inFlight.delete(session.id)
		}
	}

	fromResponse({ access_token, session }: SessionResponse) {
		this.tokens.set(session, access_token)
		let expireIn = minute * 15
		let threshold = 30 //seconds
		let expiresIn = new Date()
		let now = expiresIn.getSeconds()
		let expire = now + expireIn - threshold
		expiresIn.setSeconds(expire)
		this.expireIn.set(session, expiresIn)	
	}
}


let minute = 60 * 60