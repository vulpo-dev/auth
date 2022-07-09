import { ApiError as SdkError } from '@vulpo-dev/auth-sdk'

export enum ApiError {
	InternalServerError = "internal_error",
	BadRequest = "bad_request",
	NotFound = "not_found",
	Forbidden = "forbidden",
	Unavailable = "unavailable",
	GenericError = 'generic_error',

	AdminHasAdmin = "admin/has_admin",

	ProjectNotFound = "project/not_found",
	ProjectNameExists = "project/name_exists",

	UserExists = "user/exists",
	UserInvalidProject = "user/invalid_project",
}

function isApiError(maybeCode: string): maybeCode is ApiError {
	let index = Object.values(ApiError).findIndex(c => c === maybeCode)
	return index !== -1
}

export function getErrorCode(res: SdkError): ApiError {
	if (!res.code) {
		return ApiError.Unavailable
	}

	let { code } = res

	if (!code) {
		return ApiError.GenericError
	}

	if (isApiError(code)) {
		return code
	}

	return ApiError.GenericError
}