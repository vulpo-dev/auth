export enum ErrorCode {
	InternalServerError = 'internal_error',
	BadRequest = 'bad_request',
	NotFound = 'not_found',
	NotAllowed = 'forbidden',
	Unavailable = 'unavailable',
	GenericError = 'generic_error',
	Unauthorized = 'unauthorized',
	AbortError = 'aborted',

	AuthTokenMissing = 'auth/token_missing',
	PasswordMinLength = 'password/min_length',
	PasswordMaxLength = 'password/max_length',
	AuthRefreshTokenMissing = 'auth/refresh_token_missing',
	AuthRefreshTokenNotFound = 'auth/refresh_token_not_found',
	AuthRefreshTokenInvalidFormat = 'auth/refresh_token_invalid_format',
	InvalidEmailPassword = 'auth/invalid_email_password',
	
	TokenGenerate = 'token/generate',
	TokenNotFound = 'token/not_found',
	TokenInvalid = 'token/invalid',
	TokenExpired = 'token/expired',

	ResetInvalidToken = 'reset/invalid_token',
	ResetTokenNotFound = 'reset/token_not_found',
	ResetExpired = 'reset/expired',
	ResetPasswordMismatch = 'reset/password_mismatch',

	PasswordlessAwaitConfirm = 'passwordless/await_confirm',
	PasswordlessTokenExpire = 'passwordless/token_expire',
	PasswordlessInvalidToken = 'passwordless/invalid_token',

	ClientUserIdNotFound = 'client/user_id_not_found',

	SessionNotFound = 'session/not_found',
	SessionKeysNotFound = 'session/keys_not_found',
	SessionExpired = 'session/expired',

	UserDisabled = 'user/disabled',
	UserDuplicate = 'user/duplicate',
	UserExists = 'user/exists',

	InvalidArguments = 'invalid/arguments'
}

export type ErrorResponse = {
	code: ErrorCode
}

export function isErrorResponse(data: any): data is ErrorResponse {
	return data?.code !== undefined
}

export function errorFromResponse(response: Response, data: ErrorResponse): ApiError {
		let { status } = response

		if (status === 503) {
			return new GenericError(response, ErrorCode.Unavailable)
		}

		if (status === 403 && !data.code) {
			return new GenericError(response, ErrorCode.NotAllowed)
		}

		if (status === 401 && !data.code) {
			return new GenericError(response, ErrorCode.Unauthorized)
		}

		switch(data.code) {
			case ErrorCode.NotFound:
			case ErrorCode.BadRequest:
			case ErrorCode.InternalServerError:
			case ErrorCode.NotAllowed:
				return new GenericError(response, data.code)

			case ErrorCode.UserDisabled:
			case ErrorCode.AuthTokenMissing:
			case ErrorCode.PasswordMinLength:
			case ErrorCode.PasswordMaxLength:
			case ErrorCode.AuthRefreshTokenMissing:
			case ErrorCode.AuthRefreshTokenNotFound:
			case ErrorCode.AuthRefreshTokenInvalidFormat:
			case ErrorCode.InvalidEmailPassword:
			case ErrorCode.ResetInvalidToken:
			case ErrorCode.ResetTokenNotFound:
			case ErrorCode.ResetExpired:
			case ErrorCode.ResetPasswordMismatch:
			case ErrorCode.PasswordlessAwaitConfirm:
			case ErrorCode.PasswordlessTokenExpire:
			case ErrorCode.PasswordlessInvalidToken:
			case ErrorCode.SessionExpired:
			case ErrorCode.TokenGenerate:
			case ErrorCode.TokenInvalid:
			case ErrorCode.TokenExpired:
			case ErrorCode.TokenNotFound:
				return new AuthError(data.code, response)

			default:
				let code = isErrorCode(response.statusText) ? response.statusText : ErrorCode.GenericError
				return new GenericError(response, code)
		}
	}

export type ApiError = AuthError | GenericError

export interface Code {
	code: ErrorCode
}

export class AuthError extends Error implements Code {
	code: ErrorCode;
	response: Response;

	constructor(code: ErrorCode, response: Response) {
		super(code)
		this.name = 'AuthError'
		this.code = code
		this.response = response
	}
}


export class GenericError extends Error implements Code {
	code: ErrorCode;
	response: Response;

	constructor(response: Response, code?: ErrorCode) {
		super(code)
		this.name = 'GenericError'
		this.code = code ?? ErrorCode.GenericError
		this.response = response
	}
}

export class AbortError extends Error {
	code = ErrorCode.AbortError
}

export class ClientError extends Error {
	code: ErrorCode

	constructor(message?: string) {
		super(message)
		this.name = 'NoUserId'
		this.code = ErrorCode.ClientUserIdNotFound
	}
}

export class SessionNotFoundError extends Error {
	code = ErrorCode.SessionNotFound
}

export class SessionKeysNotFoundError extends Error {
	code = ErrorCode.SessionKeysNotFound
}

export function isErrorCode(code: string): code is ErrorCode {
	let index = Object.values(ErrorCode).findIndex(item => {
		return item === code
	})

	return index !== -1
}
