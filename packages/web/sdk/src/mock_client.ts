declare var jest: typeof import('@jest/globals').jest

import { IAuthClient } from './client'
import {
	AuthCallback,
	SessionInfo,
	SetPasswordPayload,
	User,
	UserState,
	GenerateApiKey,
    ApiKeys,
} from './types'
import { uuid } from './utils'
import { faker } from '@faker-js/faker'
import { AuthError, ErrorCode, GenericError } from './error'

export class MockAuthClient implements IAuthClient {
	setProject = jest
		.fn<IAuthClient['setProject']>()
		.mockImplementation((_id: string) => {})

	signIn = jest
		.fn<IAuthClient['signIn']>()
		.mockImplementation(async (email: string, _password: string) => {
			return getUser(email)
		})

	signUp = jest
		.fn<IAuthClient['signUp']>()
		.mockImplementation(async (email: string, _password: string) => {
			return getUser(email)
		})

	signOut = jest
		.fn<IAuthClient['signOut']>()
		.mockImplementation(async (_sessionId?: string) => {})

	signOutAll = jest
		.fn<IAuthClient['signOutAll']>()
		.mockImplementation(async (_sessionId?: string) => {})

	getToken = jest
		.fn<IAuthClient['getToken']>()
		.mockImplementation(async (_sessionId?: string) => {
			return ''
		})

	forceToken = jest
		.fn<IAuthClient['forceToken']>()
		.mockImplementation(async (_sessionId?: string) => {
			return ''
		})		

	resetPassword = jest
		.fn<IAuthClient['resetPassword']>()
		.mockImplementation(async (_email: string) => {})		

	setResetPassword = jest
		.fn<IAuthClient['setResetPassword']>()
		.mockImplementation(async (_body: SetPasswordPayload) => {})

	setPassword = jest
		.fn<IAuthClient['setPassword']>()
		.mockImplementation(async (_password: string) => {})

	verifyToken = jest
		.fn<IAuthClient['verifyToken']>()
		.mockImplementation(async (_id: string, _token: string) => {})

	passwordless = jest
		.fn<IAuthClient['passwordless']>()
		.mockImplementation(async (_email: string) => {
			return { id: uuid(), session: uuid() }
		})

	confirmPasswordless = jest
		.fn<IAuthClient['confirmPasswordless']>()
		.mockImplementation(async (id: string, _token: string) => {
			switch(id) {
				case 'token-invalid':
					throw authError(ErrorCode.PasswordlessInvalidToken)

				case 'token-expire':
					throw authError(ErrorCode.PasswordlessTokenExpire)

				case 'internal':
					throw error(ErrorCode.InternalServerError)
			}
		})

	verifyEmail = jest
		.fn<IAuthClient['verifyEmail']>()
		.mockImplementation(async (_id: string, _token: string) => {})

	verifyPasswordless = jest
		.fn<IAuthClient['verifyPasswordless']>()
		.mockImplementation(async (_id: string, _session: string) => {
			return getUser()
		})

	authStateChange = jest
		.fn<IAuthClient['authStateChange']>()
		.mockImplementation((_cb: AuthCallback) => {
			return {
				unsubscribe: () => {}
			}
		})

	activate = jest
		.fn<IAuthClient['activate']>()

	active: SessionInfo | null = null

	withToken = jest
		.fn<IAuthClient['withToken']>()

	flags = jest
		.fn<IAuthClient['flags']>()
		.mockImplementation(async () => {
			return []
		})

	getUser = jest
		.fn<IAuthClient['getUser']>()
		.mockImplementation(() => {
			return getUser()
		})

	oAuthGetAuthorizeUrl = jest
		.fn<IAuthClient['oAuthGetAuthorizeUrl']>()
		.mockImplementation(async (_provider) => {
			return ''
		})

	oAuthConfirm = jest
		.fn<IAuthClient['oAuthConfirm']>()
		.mockImplementation(async (_csrf_token: string, _code: string) => {
			return [getUser(), '']
		})

	updateEmail = jest
		.fn<IAuthClient['updateEmail']>()
		.mockImplementation(async () => {})

	rejectUpdateEmail = jest
		.fn<IAuthClient['rejectUpdateEmail']>()
		.mockImplementation(async (id: string) => {
			errors(id)
		})

	confirmUpdateEmail = jest
		.fn<IAuthClient['confirmUpdateEmail']>()
		.mockImplementation(async (id: string) => {
			errors(id)
		})

	generateApiKey = jest
		.fn<IAuthClient['generateApiKey']>()
		.mockImplementation(async (payload: GenerateApiKey) => {
			errors(payload.name)
			return uuid()
		})

	listApiKeys = jest
		.fn<IAuthClient['listApiKeys']>()
		.mockImplementation(async () => {
			let res: ApiKeys = {
				keys: [{
					id: uuid(),
					created_at: faker.date.past().toISOString()
				}]
			}
			
			return res
		})
}

function getUser(email: string = faker.internet.email()): User {
	return {
		id: uuid(),
		display_name: faker.internet.userName(),
		email: email,
		email_verified: faker.datatype.boolean(),
		photo_url: faker.image.imageUrl(),
		traits: [],
		data: {},
		provider_id: 'email',
		created_at: faker.date.past().toISOString(),
		updated_at: faker.date.past().toISOString(),
		state: UserState.Active,
		device_languages: [],
	}
}

function authError(code: ErrorCode) {
	return new AuthError(code, {} as Response)
}

function error(code: ErrorCode) {
	return new GenericError({} as Response, code)
}

function errors(type: string) {
	switch(type) {
		case 'passwordless-invalid-token':
			throw authError(ErrorCode.PasswordlessInvalidToken)

		case 'passwordless-token-expire':
			throw authError(ErrorCode.PasswordlessTokenExpire)

		case 'internal':
			throw error(ErrorCode.InternalServerError)

		case 'not_allowed':
			throw error(ErrorCode.NotAllowed)
	}
}
