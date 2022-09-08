import {
	SessionResponse,
	SessionId,
	AccessToken,
	Url,
	RefreshAccessTokenPayload,
} from './types'
import { Session as SessionEntry } from './storage'
import { ratPayload } from './keys'
import { SessionService } from './session'
import { IHttpService } from './utils'

type InFlight = Promise<string>

export class Tokens {
	tokens: Map<SessionId, AccessToken> = new Map();

	private inFlight: Map<SessionId, InFlight> = new Map();
	private session: SessionService;
	private httpService: IHttpService;

	constructor(session: SessionService, http: IHttpService) {
		this.session = session
		this.httpService = http
	}

	getToken = async (session: SessionEntry): Promise<AccessToken> => {
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

	forceToken = async (session: SessionEntry): Promise<AccessToken> => {
		let inFlight = this.inFlight.get(session.id)
		if (inFlight !== undefined) {
			return inFlight
		}

		let promise = this._getToken(session)
		this.inFlight.set(session.id, promise)
		return promise
	}

	private async _getToken(session: SessionEntry): Promise<AccessToken> {
		let value = await this.session.generateAccessToken(session.id, ratPayload())

		if (!value) {
			return Promise.reject(null)
		}

		let url = Url.TokenRefresh.replace(':session', session.id)
		let payload: RefreshAccessTokenPayload = { value }
		let { data } = await this.httpService.post<SessionResponse>(url, payload)
		this.fromResponse(data)
		this.session.fromResponse(data)
		this.inFlight.delete(session.id)
		return data.access_token
	}

	fromResponse({ access_token, session }: SessionResponse) {
		this.tokens.set(session, access_token)
	}
}
