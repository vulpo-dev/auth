import { AxiosError, AxiosResponse } from 'axios'

export enum ErrorCode {
	InternalServerError = 'internal_error',
	BadRequest = 'bad_request',
	NotFound = 'not_found',
	NotAllowed = 'forbidden',

	AuthTokenMissing = 'auth/token_missing',
	AuthPasswordLength = 'auth/password_length',
	AuthRefreshTokenMissing = 'auth/refresh_token_missing',
	AuthRefreshTokenNotFound = 'auth/refresh_token_not_found',
	AuthRefreshTokenInvalidFormat = 'auth/refresh_token_invalid_format',
	InvalidEmailPassword = 'auth/invalid_email_password',
	TokenGenerate = 'token/generate'
}

type ErrorResponse = {
	code: ErrorCode
}

export class ApiError {

	fromResponse(res: AxiosError<ErrorResponse>) {
		switch(res.response?.data?.code) {
			case ErrorCode.NotFound:
			case ErrorCode.BadRequest:
			case ErrorCode.InternalServerError:
			case ErrorCode.NotAllowed:
				return new HttpError(res.response.data.code)

			case ErrorCode.AuthTokenMissing:
			case ErrorCode.AuthPasswordLength:
			case ErrorCode.AuthRefreshTokenMissing:
			case ErrorCode.AuthRefreshTokenNotFound:
			case ErrorCode.AuthRefreshTokenInvalidFormat:
			case ErrorCode.TokenGenerate:
			case ErrorCode.InvalidEmailPassword:
				return new AuthError(res.response.data.code)

			default:
				return new Error(res.response?.statusText)
		}
	}
}

export class HttpError extends Error {
	code: ErrorCode;

	constructor(code: ErrorCode) {
		super()
		this.name = 'HttpError'
		this.code = code
	}
}

export class AuthError extends Error {
	code: ErrorCode;

	constructor(code: ErrorCode) {
		super()
		this.name = 'AuthError'
		this.code = code
	}
}
