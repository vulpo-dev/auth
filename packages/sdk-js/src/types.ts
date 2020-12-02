
export type User =
	{ id: string
	}

export enum ApiError {
	InternalServerError
}

export type TokenResponse = {
	access_token: string,
	refresh_token: string,
	expire_in: number
}

export type $Config =
	{ baseURL: string
	, offline?: boolean
	, project: string
	}

export type UserState = User | null | undefined
export type AuthCallback = (u: UserState) => void
export type Unsubscribe = () => void
export type PasswordOptions =
	{ remember: boolean
	}
