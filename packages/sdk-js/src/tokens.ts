import {
	Token,
	SessionResponse,
	SessionId,
	AccessToken,
	Url,
} from 'types'

import { Session as SessionEntry } from 'storage'
import { generateAccessToken, ratPayload } from 'keys'
import { Session } from 'session'
import { AxiosInstance } from 'axios'
import { ClientError } from 'error'

type InFlight = Promise<string>

type TokenPromise = {
	resolve: (token: string | null) => void;
	reject: (err: any) => any
}

export class Tokens {
	tokens: Map<SessionId, AccessToken> = new Map();

	private inFlight: Map<SessionId, InFlight> = new Map();
	private session: Session;
	private http: AxiosInstance;
	private created_at: Date = new Date()

	constructor(session: Session, http: AxiosInstance) {
		this.session = session
		this.http = http
	}

	async getToken(session: SessionEntry): Promise<AccessToken> {
		let inFlight = this.inFlight.get(session.id)
		if (inFlight !== undefined) {
			return inFlight
		}

		let token = this.tokens.get(session.id)
		
		if (!token) {
			let promise = this._getToken(session)
			this.inFlight.set(session.id, promise)
			return promise
		}

		return token
	}

	async forceToken(session: SessionEntry): Promise<AccessToken> {
		let inFlight = this.inFlight.get(session.id)
		if (inFlight !== undefined) {
			return inFlight
		}

		let promise = this._getToken(session)
		this.inFlight.set(session.id, promise)
		return promise
	}

	private async _getToken(session: SessionEntry): Promise<AccessToken> {
		let value = await generateAccessToken(session.id, ratPayload())
		let url = Url.TokenRefresh.replace(':session', session.id)
		let { data } = await this.http.post<SessionResponse>(url, { value })
		this.fromResponse(data)
		this.session.fromResponse(data)
		this.inFlight.delete(session.id)
		return data.access_token
	}

	fromResponse({ access_token, session }: SessionResponse) {
		this.tokens.set(session, access_token)
	}
}


let minute = 60 * 60