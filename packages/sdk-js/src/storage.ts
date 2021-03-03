import type { User, SessionId } from 'types'
import { createStore, get, set, del } from 'idb-keyval'

export type Key = {
	privateKey: CryptoKey,
	publicKey: CryptoKey,
}

class KeyStorage {
	store = createStore('auth-db', 'keys')

	async get(id: string): Promise<Key | undefined> {
		return await get(id, this.store)
	}

	async set(session: string, keys: Key) {
		return await set(session, keys, this.store)
	}

	async delete(id: string) {
		return await del(id, this.store)
	}
}

export let Keys = new KeyStorage()

export type SessionInfo = {
	id: SessionId,
	user?: User,
	expire_at?: string
}

export type Session = SessionInfo & Key

class SessionsStorage {
	private key = 'auth-db::sessions'
	private cache: Array<SessionInfo> | undefined = undefined

	getAll(): Array<SessionInfo> {

		if (this.cache) {
			return this.cache
		}

		let value = localStorage.getItem(this.key)

		if (!value) {
			return []
		}

		let entries = JSON.parse(value) as Array<SessionInfo>
		this.cache = entries
		return entries 
	}

	get(id: SessionId): SessionInfo | null {
		return this.getAll().find(session => session.id === id) ?? null
	}

	async delete(id: SessionId) {
		let entries = this.getAll().filter(session => session.id !== id)
		this.set(entries)
		await Keys.delete(id)
	}

	async deleteAll() {
		let sink = this.getAll().map(session => {
			return Keys.delete(session.id)
		})

		await Promise.all(sink)
		
		this.cache = undefined
		localStorage.removeItem(this.key)
	}

	insert(session: SessionInfo): SessionInfo {
		let entries = this.getAll().concat([session])
		this.set(entries)
		return session
	}

	update(session: SessionInfo): SessionInfo {
		let entries = this.getAll()
		let index = entries.findIndex(e => e.id === session.id)

		let newEntries = [
			...entries.slice(0, index),
			session,
			...entries.slice(index + 1)
		]

		this.set(newEntries)

		return session
	}

	upsert(session: SessionInfo): SessionInfo {
		let entry = this.get(session.id)
		
		if (entry) {
			this.update(session)
		} else {
			this.insert(session)
		}

		return session
	}

	private set(sessions: Array<SessionInfo>) {
		this.cache = sessions
		localStorage.setItem(this.key, JSON.stringify(sessions))
	}
}

export let Sessions = new SessionsStorage()


class Storage {
	key = 'auth-db::active_user'
	
	remove(id: SessionId): boolean {
		let active = this.getActive()

		if (active === id) {
			localStorage.removeItem(this.key)
			return true
		}

		return false
	}

	removeAll() {
		localStorage.removeItem(this.key)
	}

	getActive(): SessionId | null {
		return localStorage.getItem(this.key) ?? null
	}

	setActive(session: SessionId) {
		localStorage.setItem(this.key, session)
	}
}

export default new Storage()
