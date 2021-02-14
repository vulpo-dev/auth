import type { User } from 'types'

type MemoryStorage = {
	users: Array<User>;
	active: null | string;
}

class Storage {
	key = 'bento_auth::user'
	activeKey = 'bento_auth::active_user'
	memoryStorage: MemoryStorage = {
		users: [],
		active: null,
	}
	
	insert(u: Array<User>) {
		if (isBrowser()) {
			let user = JSON.stringify(u)
			localStorage.setItem(this.key, user)
		} else {
			this.memoryStorage.users = u
		}
	}

	add(user: User) {
		let users = this.get()
		this.insert([...users, user])
	}

	get(): Array<User> {
		if (isBrowser()) {
			let entry = localStorage.getItem(this.key)
			
			if (!entry) {
				return []
			}

			let user = JSON.parse(entry)
			return (user as Array<User>)
		} else {
			let entry = this.memoryStorage.users

			if (!entry) {
				return []
			}

			return entry
		}
	}

	remove(id: string): void {
		if (isBrowser()) {
			let users = this.get()

			users = users.filter(user => {
				return user.id !== id
			})

			localStorage.setItem(this.key, JSON.stringify(users))
		} else {
			let users = this.get()
			
			users = users.filter(user => {
				return user.id !== id
			})

			this.memoryStorage.users = users
		}
	}

	removeAll() {
		if (isBrowser()) {
			localStorage.removeItem(this.key)
			localStorage.removeItem(this.activeKey)
		} else {
			this.memoryStorage = {
				users: [],
				active: null
			}
		}
	}

	getActive(): string | null {
		let entry = isBrowser()
			? localStorage.getItem(this.activeKey)
			: this.memoryStorage.active

		if (!entry) {
			return null
		}

		return entry
	}

	setActive(userId: string) {
		if (isBrowser()) {
			localStorage.setItem(this.activeKey, userId)
		} else {
			this.memoryStorage.active = userId
		}
	}
}

export default new Storage()

function isBrowser(): boolean {
	return typeof window !== 'undefined' && 'localStorage' in window
}