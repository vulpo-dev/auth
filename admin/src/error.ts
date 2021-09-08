import { AxiosError } from 'axios'

export enum ApiError {
	InternalServerError = "internal_error",
	BadRequest = "bad_request",
	NotFound = "not_found",
	Forbidden = "forbidden",
	Unavailable = "unavailable",
	GenericError = 'generic_error',

	AdminHasAdmin = "admin/has_admin",
	AdminExists = "admin/exits",

	ProjectNotFound = "project/not_found",
	ProjectNameExists = "project/name_exists",

	UserExists = "user/exists",

}

function isApiError(maybeCode: string): maybeCode is ApiError {
	let index = Object.values(ApiError).findIndex(c => c === maybeCode)
	return index !== -1
}

type ErrorResponse = {
	code: string
}

export function getErrorCode(res: AxiosError<ErrorResponse>): ApiError {
	if (res.response?.status === 503) {
		return ApiError.Unavailable
	}

	let code = res.response?.data?.code

	if (!code) {
		return ApiError.GenericError
	}

	if (isApiError(code)) {
		return code
	}

	return ApiError.GenericError
}