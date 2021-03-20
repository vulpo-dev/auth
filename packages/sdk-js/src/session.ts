import type {
	UserState,
	User,
	AuthCallback,
	SessionResponse,
	Config,
	Unsubscribe,
	SessionId,
	Claims,
	AccessToken,
	SessionInfo,
} from 'types'

import Storage, { Sessions } from 'storage'
import { shallowEqualObjects } from 'shallow-equal'
import { makeId } from 'utils'
import jwtDecode from 'jwt-decode'
import { AxiosInstance } from 'axios'
import { ApiError } from 'error'

type Listener = {
	id: number;
	cb: AuthCallback;
}

export class Session {
	sessions = new Map<SessionId, SessionInfo>()
 	active: SessionInfo | null = null
	config: Config

	private getId = makeId()
	private listener: Array<Listener> = []
	private http: AxiosInstance;
	private error: ApiError = new ApiError();

	constructor(config: Config, http: AxiosInstance) {
		let id = Storage.getActive()
			
		Sessions.getAll().forEach(session => {
			if (session.id === id) {
				this.active = session
				this.setCurrent(session)
			}
			this.sessions.set(session.id, session)
		})

		Sessions.changes(sessions => {
			this.sessions.clear()
			sessions.forEach(session => {
				this.sessions.set(session.id, session)
			})
		})

		Storage.changes(active => {
			if (active === null) {
				this.setCurrent(null)
				return
			}

			let session = Sessions.get(active)
			this.setCurrent(session)
		})

		this.config = config
		this.http = http
	}

	current(session?: SessionId): SessionInfo | null {
		let id = session ?? Storage.getActive()
		if (!id) {
			return null
		}
		let s = Sessions.get(id)
		return s ?? null
	}

	activate(id: SessionId) {
		let session = Sessions.get(id)
		
		if (session) {
			Storage.setActive(session.id)
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

	async fromResponse(data: SessionResponse): Promise<SessionInfo> {
		let user = await this.getUser(data.access_token)
			.catch(res => Promise.reject(this.error.fromResponse(res)))

		let staleSessions = Sessions
			.getAll()
			.filter(session => (
				session.id !== data.session &&
				(!session.user || session.user.id === user.id)
			))

		await Promise.all(
			staleSessions.map(session =>  {
				Sessions.delete(session.id)
			})
		)
		
		let session = Sessions.upsert({
			id: data.session,
			expire_at: data.expire_at,
			user,
		})

		return session
	};

	async getUser(token: AccessToken): Promise<User> {
		let claims = jwtDecode<Claims>(token)
		return this.http
			.get<User>(`/user/get/${claims.sub}`, {
				headers: {
					'Authorization': `Bearer ${token}`,
				}
			})
			.then(res => res.data)
	}

	async remove(session: SessionId) {
		await Sessions.delete(session)

		if (session === this.active?.id) {
			let [next] = Sessions.getAll()
			this.setCurrent(next ?? null)
			Storage.setActive(next?.id)
		}
	}

	async removeAll() {
		Storage.removeAll()
		await Sessions.deleteAll()
		this.sessions.clear()
		this.setCurrent(null)
	}

	setCurrent(session: SessionInfo | null) {
		let sameUser = shallowEqualObjects(this.active?.user, session?.user)

		if (sameUser) {
			return
		}

		if (this.active === null && session) {
			Storage.setActive(session.id)
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
