import type {
	UserState,
	User as UserId,
	AuthCallback,
	TokenResponse,
	Config,
	Unsubscribe
} from 'types'

import Storage from 'storage'
import { shallowEqualObjects } from 'shallow-equal'
import { makeId, getUser } from 'utils'

type Listener = {
	id: number;
	cb: AuthCallback;
}

export class User {
	current: UserState
	users: Map<string, UserId> = new Map()
 	active: string | null
	config: Config

	private getId = makeId()
	private listener: Array<Listener> = []

	constructor(config: Config) {
		let id = Storage.getActive()
		let userEntrys = Storage.get()
		let users = userEntrys ? userEntrys : []
		
		let user = id === '' ? userEntrys[0] : userEntrys.find(user => {
			return user.id === id
		})

		this.active = id
		this.users = new Map(
			users.map(user => [user.id, user])
		)
		this.current = user
		this.config = config
	}

	activate(userId: string) {
		this.active = userId

		let user = this.users.get(userId)
		if (!shallowEqualObjects(this.current, user)) {
			this.current = user
			this.listener.forEach(entry => {
				entry.cb(user)
			})
		}

		Storage.setActive(userId)
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

	fromResponse(data: TokenResponse): UserId | undefined {
		let id = data.user_id
		this.active = id

		let user = getUser(data.token)
		this.users.set(id, user)

		if (this.config.offline) {
			Storage.add(user)
		}

		if (!shallowEqualObjects(this.current, user)) {
			this.current = user
			this.listener.forEach(entry => {
				entry.cb(user)
			})
		}

		return user
	};

	remove(userId: string) {
		Storage.remove(userId)
	}

	removeAll() {
		Storage.removeAll()
	}

	setCurrent(user: UserState) {
		this.current = user
		this.listener.forEach(entry => {
			entry.cb(user)
		})
	}
}
