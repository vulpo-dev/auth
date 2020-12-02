import type { User } from './types'

let Storage =
	{ key: 'bento_auth::user'
	, insert(u: User | null) {
			let user = u ? JSON.stringify(u) : ""
			localStorage.setItem(this.key, user)
		}

	, get(): User | null {
			let entry = localStorage.getItem(this.key)
			
			if (!entry) {
				return null
			}

			let user = JSON.parse(entry)
			return (user as User)
		}

	, remove(): void {
			localStorage.removeItem(this.key)
		}
}

export default Storage