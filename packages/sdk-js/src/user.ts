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
import { makeId, getUsers, last } from 'utils'

type Listener = {
	id: number;
	cb: AuthCallback;
}

export class User {
	current: UserState;
	users: Array<UserId>;
	active: string | null;
	config: Config

	private getId = makeId();
	private listener: Array<Listener> = [];

	constructor(config: Config) {
		let id = Storage.getActive()
		let userEntrys = Storage.get()
		let users = userEntrys ? userEntrys : []
		
		let user = id === '' ? userEntrys[0] : userEntrys.find(user => {
			return user.id === id
		})

		this.active = id
		this.users = users
		this.current = user
		this.config = config
	}

	activate(userId: string) {
		this.active = userId

		let user = this.users.find(user => {
			return user.id === this.active
		})

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
		return {
			unsubscribe: () => {
				this.listener = this
					.listener
					.filter(entry => entry.id !== id)
			}
		}
	}

	fromResponse(data: TokenResponse): UserId | undefined {
		let id = last<string>(data.users) ?? ''
		this.active = id

		let users = getUsers(data.tokens)
		this.users = users

		if (this.config.offline) {
			Storage.insert(users)
		}

		let user = users.find(user => {
			return user.id === this.active
		})

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

	setCurrent(user: UserState) {
		this.current = user
		this.listener.forEach(entry => {
			entry.cb(user)
		})
	}
}
