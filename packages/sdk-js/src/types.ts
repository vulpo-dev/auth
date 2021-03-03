
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


export type SessionResponse = {
	access_token: string;
	created: boolean;
	user_id: string;
	expire_at: string;
	session: string;
}

export type Config = {
	baseURL: string;
	project: string;
}

export type UserState = User | null | undefined
export type AuthCallback = (u: UserState) => void
export type Unsubscribe = { unsubscribe: () => void }
export type PasswordOptions = {
	remember: boolean;
}

export type TokenListener = (token: String | null) => void

export type SessionId = string
export type AccessToken = string

export interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void
}

export type SetPassword = {
	id: string;
	token: string;
	password1: string;
	password2: string;
}
