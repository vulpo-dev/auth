import { IKeyStorage, ISessionsStorage, IStorage, Key } from '../../src/storage'
import { SessionInfo } from '../../src/types'

export class SessionsStorage implements ISessionsStorage {

	private sessions = new Map<string, SessionInfo>()

	changes = jest.fn(() => {
		return () => {}
	})

	getAll = jest.fn(() => {
		return Array.from(this.sessions.values())
	})

	get = jest.fn((id: string) => {
		return this.sessions.get(id) ?? null
	})

	delete = jest.fn(() => Promise.resolve())

	deleteAll = jest.fn(() => Promise.resolve())

	insert = jest.fn((session: SessionInfo) => {
		this.sessions.set(session.id, session)
		return session	
	})

	update = jest.fn((session: SessionInfo) => {
		this.sessions.set(session.id, session)
		return session
	})

	upsert = jest.fn((session: SessionInfo) => {
		this.sessions.set(session.id, session)
		return session
	})
}

export class KeyStorage implements IKeyStorage {
	private keys = new Map<string, Key>()

	get = jest.fn(async (id: string) => {
		return this.keys.get(id) ?? undefined
	})

	set = jest.fn(async (session: string, keys: Key) => {
		this.keys.set(session, keys)
	})

	delete = jest.fn(async (id: string) => {
		this.keys.delete(id)
	})
}

export class Storage implements IStorage {
	private activeUser?: string

	changes = jest.fn(() => {
		return () => {}
	})

	remove = jest.fn((id: string) => {
		this.activeUser = undefined
		return true
	})

	removeAll = jest.fn(() => {
		this.activeUser = undefined
	})

	getActive = jest.fn(() => {
		return this.activeUser ?? null
	})

	setActive = jest.fn((session: string) => {
		this.activeUser = session
	})
} 