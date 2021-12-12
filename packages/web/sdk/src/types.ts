import type { AxiosInstance } from 'axios'

export type EmailPasswordPayload = {
	email: string;
	password: string;
	public_key: Array<number>;
	session: string;
	device_languages?: Array<string>;
}

export type PasswordResetPayload = {
	email: string;
}

export type VerifyResetTokenPayload = {
	id: string;
	token: string;
}

export type SetPasswordPayload = {
	id: string;
	token: string;
	password1: string;
	password2: string;
}

export type RequestPasswordlessPayload = {
	email: string;
	public_key: Array<number>;
	session: string;
	device_languages: Array<string>;
}

export type PasswordlessResponse = {
	id: string;
	session: string;
}

export type ConfirmPasswordlessPayload = {
	id: string;
	token: string;
}

export type VerifyPasswordlessPayload = {
	id: string;
	token: string;
	session: string;
	device_languages: Array<string>;
}

export type RefreshAccessTokenPayload = {
	value: string;
}

export type VerifyEmailPayload =  {
	id: string;
	token: string;
}

export type SessionInfo = {
	id: SessionId,
	user?: User | null,
	expire_at?: string
}

export enum UserState {
	Active = 'active',
	Disabled = 'disabled',
	SetPassword = 'set_password',
}

export type User = {
	id: string;
	display_name?: string,
	email: string,
	email_verified: boolean,
	photo_url?: string,
	traits: Array<string>,
	data: Object,
	provider_id: string,
	created_at: string,
	updated_at: string,
	state: UserState,
	device_languages: Array<string>,
}

export type UpdateUserPayload = Pick<User,
	"display_name" |
	"email" |
	"traits" |
	"photo_url" |
	"data" 
>

export enum ApiError {
	InternalServerError
}

export type Claims = {
	sub: string;
	exp: number,
	iss: string,
	traits: Array<string>,
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
	preload?: boolean;
	http?: AxiosInstance;
}

export type UserAuthState = User | null | undefined
export type AuthCallback = (u: SessionInfo | null | undefined) => void
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

export enum Url {
	SignIn = '/password/sign_in',
	SignUp = '/password/sign_up',
	SignOut = '/user/sign_out/:session',
	SignOutAll = '/user/sign_out_all/:session',

	RequestPasswordReset = '/password/request_password_reset',
	PasswordReset = '/password/password_reset',
	VerifyResetToken = '/password/verify_reset_token',

	Passwordless = '/passwordless/',
	PasswordlessConfim = '/passwordless/confirm',
	PasswordlessVerify = '/passwordless/verify',

	UserVerifyEmail = '/user/verify_email',
	UserGet = '/user/get',
	UserDeleteAccount = '/user/delete_account/:session',
	UserUpdate = '/user/update',
	UserSetPassword = '/user/set_password',

	TokenRefresh = '/token/refresh/:session',

	Flags = '/project/flags'
}

export enum Flag {
	SignIn = 'auth::signin',
	SignUp = 'auth::signup',
	PasswordReset = 'action::password_reset',
	VerifyEmail = 'action::verify_email',
	EmailAndPassword = 'method::email_password',
	AuthenticationLink = 'method::authentication_link',
}