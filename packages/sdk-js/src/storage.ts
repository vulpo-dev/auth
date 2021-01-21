import type { User } from 'types'

let Storage = {
	key: 'bento_auth::user',
	activeKey: 'bento_auth::active_user',
	
	insert(u: Array<User>) {
		let user = JSON.stringify(u)
		localStorage.setItem(this.key, user)
	},

	get(): Array<User> {
		let entry = localStorage.getItem(this.key)
		
		if (!entry) {
			return []
		}

		let user = JSON.parse(entry)
		return (user as Array<User>)
	},

	remove(id: string): void {
		let users = this.get()

		users = users.filter(user => {
			return user.id !== id
		})

		localStorage.setItem(this.key, JSON.stringify(users))
	},

	removeAll() {
		localStorage.removeItem(this.key)
		localStorage.removeItem(this.activeKey)
	},

	getActive(): string | null {
		let entry = localStorage.getItem(this.activeKey)

		if (!entry) {
			return ''
		}

		return entry
	},

	setActive(userId: string) {
		localStorage.setItem(this.activeKey, userId)
	}
}

export default Storage