
export type User = {
	id: string;
}

export enum ApiError {
	InternalServerError
}

export type Token = {
	access_token: string;
	refresh_token: string;
	expires_in: number;
}

export type TokenResponse = {
	token: Token;
	user_id: string;
}

export type Config = {
	baseURL: string;
	project: string;
	offline?: boolean;
	preload?: boolean;
}

export type UserState = User | null | undefined
export type AuthCallback = (u: UserState) => void
export type Unsubscribe = { unsubscribe: () => void }
export type PasswordOptions = {
	remember: boolean;
}

export type TokenListener = (token: String | null) => void