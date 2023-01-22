import {
	User,
	AuthCallback,
	SessionResponse,
	Unsubscribe,
	SessionId,
	AccessToken,
	SessionInfo,
    Url,
} from './types'
import { IStorage, ISessionsStorage, IKeyStorage, Session } from './storage'
import { makeId, IHttpService, uuid } from './utils'
import { ab2str, base64url, generateKeys, isRsa } from './keys'

type Listener = {
	id: number;
	cb: AuthCallback;
}

export type FromSessionResponse = Pick<SessionResponse,
	"session" |
	"expire_at" |
	"access_token"
>

export type SessionServiceDep = {
	sessionStorage: ISessionsStorage,
	keyStorage: IKeyStorage,
	storage: IStorage,
	httpService: IHttpService,
}

export class SessionService {
	sessions = new Map<SessionId, SessionInfo>()
 	active: SessionInfo | null = null

	private getId = makeId()
	private listener: Array<Listener> = []
	private http: IHttpService;

	private sessionStorage: ISessionsStorage
	private keyStorage: IKeyStorage
	private storage: IStorage

	constructor(dep: SessionServiceDep) {
		let id = dep.storage.getActive()

		this.http = dep.httpService
		this.sessionStorage = dep.sessionStorage
		this.keyStorage = dep.keyStorage
		this.storage = dep.storage
			
		this.sessionStorage.getAll().forEach(session => {
			if (session.id === id) {
				this.active = session
				this.setCurrent(session)
			}
			this.sessions.set(session.id, session)
		})

		this.sessionStorage.changes(sessions => {
			this.sessions.clear()
			sessions.forEach(session => {
				this.sessions.set(session.id, session)
			})
		})

		this.storage.changes(active => {
			if (active === null) {
				this.setCurrent(null)
				return
			}

			let session = this.sessionStorage.get(active)
			this.setCurrent(session)
		})
	}

	/**
	 * Create and store a new session
	 * 
	 * @param extractable defaults to false
	*/
	async create(extractable = false): Promise<Session> {
		let keys = await generateKeys(extractable)
		let id = uuid()

		this.sessionStorage.insert({ id })

		await this.keyStorage.set(id, { ...keys })
		return { id, ...keys }
	}

	async generateAccessToken(sessionId: string, claims: Object = {}): Promise<string | null> {
		let session = await this.keyStorage.get(sessionId)

		if (!session) {
			return null
		}

		let header = isRsa(session.privateKey.algorithm.name)
			?	{
					alg: "RS256",
					typ: "JWT"
				}
			:	{
					alg: "ES384",
					typ: "JWT"
				}

		let payload = {
			...claims,
			jti: uuid(),
		}

		let h = base64url(JSON.stringify(header))
		let p = base64url(JSON.stringify(payload))

		let enc = new TextEncoder()
		let encoded = enc.encode(`${h}.${p}`)

		let sign = isRsa(session.privateKey.algorithm.name)
			?	"RSASSA-PKCS1-v1_5"
			:	{
			    	name: "ECDSA",
			   		hash: {name: "SHA-384"},
			  	}

		let signature = await window.crypto.subtle.sign(
		  sign,
		  session.privateKey,
		  encoded
		)

		return `${h}.${p}.${base64url(ab2str(signature))}`
	}

	current(session?: SessionId): SessionInfo | null {
		let id = session ?? this.storage.getActive()
		if (!id) {
			return null
		}
		let s = this.sessionStorage.get(id)
		return s ?? null
	}

	activate(id: SessionId) {
		let session = this.sessionStorage.get(id)
		
		if (session) {
			this.storage.setActive(session.id)
		}

		this.setCurrent(session)
	}

	subscribe(cb: AuthCallback): Unsubscribe {
		let id = this.getId()
		this.listener.push({ id, cb })

		let unsubscribe = () => 
			this.listener = this
					.listener
					.filter(entry => entry.id !== id)

		return { unsubscribe }
	}

	async fromResponse(data: FromSessionResponse): Promise<SessionInfo> {
		let user = await this.getUser(data.access_token)

		let staleSessions = this.sessionStorage
			.getAll()
			.filter(session => (
				session.id !== data.session &&
				(!session.user || session.user.id === user.id)
			))

		await Promise.all(
			staleSessions.map(session =>  {
				this.sessionStorage.delete(session.id)
			})
		)
		
		let session = this.sessionStorage.upsert({
			id: data.session,
			expire_at: data.expire_at,
			user,
		})

		return session
	}

	async getUser(token: AccessToken): Promise<User> {
		let headers = new Headers()
		headers.set('Authorization', `Bearer ${token}`)
		let { data } = await this.http.get<User>(Url.UserGet, { headers })
		return data
	}

	async remove(session: SessionId) {
		await this.sessionStorage.delete(session)

		if (session === this.active?.id) {
			let [next] = this.sessionStorage.getAll()
			this.setCurrent(next ?? null)
			this.storage.setActive(next?.id)
		}
	}

	async removeAll() {
		this.storage.removeAll()
		await this.sessionStorage.deleteAll()
		this.sessions.clear()
		this.setCurrent(null)
	}

	setCurrent(session: SessionInfo | null) {
		if (this.active === null && session) {
			this.storage.setActive(session.id)
		}

		this.active = session
		this.listener.forEach(entry => {
			entry.cb(session)
		})
	}

	getActiveUser(): User | null {
		return this.active?.user ?? null
	}
}
