import { SessionService } from '../src/session'

import { SessionsStorage, KeyStorage, Storage } from './mock/storage'

let getService = () => {

	let config = {
		baseURL: '',
		project: '',
	}

	let sessionStorage = new SessionsStorage()
	let keyStorage = new KeyStorage()
	let storage = new Storage()

	let sessionService = new SessionService({
		config,
		sessionStorage,
		keyStorage,
		storage,
		httpService: {
			get: jest.fn(),
			post: jest.fn(),
		}
	})

	return {
		sessionService,
		sessionStorage,
		keyStorage,
		storage,
	}
}

describe("SessionService", () => {
	it("can get the current session", () => {
		let { sessionService, sessionStorage, storage } = getService()

		let sessionInfo = {
			id: 'b8b6155c-4ef3-4aa2-923f-c593f22f71c6',
			user: null,
		}

		sessionStorage.insert(sessionInfo)
		storage.setActive(sessionInfo.id)

		expect(sessionService.current()).toMatchObject(sessionInfo)
	})
})
