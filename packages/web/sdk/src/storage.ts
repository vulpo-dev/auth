import type { SessionId, SessionInfo } from './types'
import { makeId } from './utils'

import { createStore, get, set, del } from 'idb-keyval'

const OAUTH_STATE_KEY = 'vulpo-auth-oauth-state'

type OAuthState = {
	requestdId: string,
	referrer: string,
	provider: string,
}

export let OAuthState = {
	insert(provider: string, requestdId: string) {
		let params = new URLSearchParams(window.location.search)

		let data: OAuthState = {
			requestdId,
			provider,
			referrer: params.get('referrer') ?? '/'
		}

		window.localStorage.setItem(OAUTH_STATE_KEY, JSON.stringify(data))
	},

	get(): OAuthState | null {
		let state = window.localStorage.getItem(OAUTH_STATE_KEY)

		if (!state) {
			return null
		}

		return JSON.parse(state) as OAuthState
	},

	delete() {
		window.localStorage.removeItem(OAUTH_STATE_KEY)
	}
}


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

type SessionsChangeCallback = (sessions: Array<SessionInfo>) => void

export type Session = SessionInfo & Key

class SessionsStorage {
	private key = 'auth-db::sessions'
	private cache: Array<SessionInfo> | undefined = undefined

	private ids = makeId()
	private listener = new Map<number, SessionsChangeCallback>()

	constructor() {
		window.addEventListener('storage', (event: StorageEvent) => {
			if (event.key !== this.key) {
				return
			}

			if (event.newValue === null) {
				this.cache = []
				return
			}

			let entries = JSON.parse(event.newValue) as Array<SessionInfo>
			this.cache = entries

			this.listener.forEach(fn => {
				fn(entries)
			})
		})
	}

	changes(fn: SessionsChangeCallback) {
		let id = this.ids()
		this.listener.set(id, fn)
		return () => {
			this.listener.delete(id)
		}
	}

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


type ActiveUserCallback = (sessions: string | null) => void

class Storage {
	key = 'auth-db::active_user'
	cache: string | undefined | null = undefined

	private ids = makeId()
	private listener = new Map<number, ActiveUserCallback>()

	constructor() {
		window.addEventListener('storage', (event: StorageEvent) => {
			if (event.key !== this.key) {
				return
			}

			this.cache = event.newValue
			this.listener.forEach(fn => fn(event.newValue))
		})
	}

	changes(fn: ActiveUserCallback) {
		let id = this.ids()
		this.listener.set(id, fn)
		return () => {
			this.listener.delete(id)
		}
	}
	
	remove(id: SessionId): boolean {
		let active = this.getActive()

		if (active === id) {
			localStorage.removeItem(this.key)
			this.cache = undefined
			return true
		}

		return false
	}

	removeAll() {
		localStorage.removeItem(this.key)
		this.cache = undefined
	}

	getActive(): SessionId | null {
		if (this.cache !== undefined) {
			return this.cache
		}

		let active = localStorage.getItem(this.key) ?? null
		this.cache = active
		return active
	}

	setActive(session: SessionId) {
		localStorage.setItem(this.key, session)
		this.cache = session
	}
}

export default new Storage()
