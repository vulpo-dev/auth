
export type User =
	{ id: string
	}

export enum ApiError {
	InternalServerError
}

export type Token = {
	access_token: string,
	refresh_token: string,
	expire_in: number
}

export type TokenResponse = {
	tokens: Array<Token>,
	users: Array<string>
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

export type TokenListener = (token: String | null) => void