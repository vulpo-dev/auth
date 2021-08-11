import { AxiosError } from 'axios'

export enum ErrorCode {
	InternalServerError = 'internal_error',
	BadRequest = 'bad_request',
	NotFound = 'not_found',
	NotAllowed = 'forbidden',
	Unavailable = 'unavailable',
	GenericError = 'generic_error',

	AuthTokenMissing = 'auth/token_missing',
	PasswordMinLength = 'password/min_length',
	PasswordMaxLength = 'password/max_length',
	AuthRefreshTokenMissing = 'auth/refresh_token_missing',
	AuthRefreshTokenNotFound = 'auth/refresh_token_not_found',
	AuthRefreshTokenInvalidFormat = 'auth/refresh_token_invalid_format',
	InvalidEmailPassword = 'auth/invalid_email_password',
	
	TokenGenerate = 'token/generate',
	TokenNotFound = 'token/not_found',

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

	UserDisabled = 'user/disabled'
}

export type ErrorResponse = {
	code: ErrorCode
}

export class ApiError {

	fromResponse(res: AxiosError<ErrorResponse>): HttpError | AuthError | GenericError {

		if (res.response?.status === 503) {
			return new HttpError(ErrorCode.Unavailable)
		}

		if (res.response?.status === 403) {
			return new HttpError(ErrorCode.NotAllowed)
		}

		switch(res.response?.data?.code) {
			case ErrorCode.NotFound:
			case ErrorCode.BadRequest:
			case ErrorCode.InternalServerError:
			case ErrorCode.NotAllowed:
				return new HttpError(res.response.data.code)

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
				return new AuthError(res.response?.data.code)

			default:
				return new GenericError(res.response?.statusText)
		}
	}
}

export class HttpError extends Error {
	code: ErrorCode;

	constructor(code: ErrorCode) {
		super(code)
		this.name = 'HttpError'
		this.code = code
	}
}

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