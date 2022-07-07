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

}

export type ErrorResponse = {
	code: ErrorCode
}

export function isErrorResponse(data: any): data is ErrorResponse {
	return Boolean(data) && data.code
}

export function errorFromResponse(response: Response, data: ErrorResponse): ApiError {
		let { status } = response

		if (status === 503) {
			return new GenericError(ErrorCode.Unavailable)
		}

		if (status === 403 && !data.code) {
			return new GenericError(ErrorCode.NotAllowed)
		}

		if (status === 401 && !data.code) {
			return new GenericError(ErrorCode.Unauthorized)
		}

		switch(data.code) {
			case ErrorCode.NotFound:
			case ErrorCode.BadRequest:
			case ErrorCode.InternalServerError:
			case ErrorCode.NotAllowed:
				return new GenericError(data.code)

			case ErrorCode.UserDisabled:
			case ErrorCode.AuthTokenMissing:
			case ErrorCode.PasswordMinLength:
			case ErrorCode.PasswordMaxLength:
			case ErrorCode.AuthRefreshTokenMissing:
			case ErrorCode.AuthRefreshTokenNotFound:
			case ErrorCode.AuthRefreshTokenInvalidFormat:
			case ErrorCode.TokenGenerate:
			case ErrorCode.InvalidEmailPassword:
			case ErrorCode.ResetInvalidToken:
			case ErrorCode.ResetTokenNotFound:
			case ErrorCode.ResetExpired:
			case ErrorCode.ResetPasswordMismatch:
			case ErrorCode.PasswordlessAwaitConfirm:
			case ErrorCode.PasswordlessTokenExpire:
			case ErrorCode.PasswordlessInvalidToken:
			case ErrorCode.SessionExpired:
				return new AuthError(data.code)

			default:
				return new GenericError(response.statusText)
		}
	}

export type ApiError = AuthError | GenericError

export class AuthError extends Error {
	code: ErrorCode;

	constructor(code: ErrorCode) {
		super(code)
		this.name = 'AuthError'
		this.code = code
	}
}


export class GenericError extends Error {
	code: ErrorCode;

	constructor(message?: string) {
		super(message)
		this.name = 'GenericError'
		this.code = ErrorCode.GenericError
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