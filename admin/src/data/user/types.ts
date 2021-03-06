import { UserState } from "@vulpo-dev/auth-sdk"

export enum Provider {
	Email,
	Link,
}

function providerFromRequest(str: string) {
	switch(str) {
		case 'link': 
			return Provider.Link

		case 'email':
		default:
			return Provider.Email
	}
}

export type PartialUser = Pick<User, 
	'created_at' |
	'email' |
	'email_verified' |
	'id' |
	'provider_id' |
	'state'
>

export type UpdateUser = Pick<User,
	'display_name' |
	'email' |
	'traits' |
	'data'
>

export function partialUserFromResponse(user: PartialUserResponse): PartialUser {
	return {
		...user,
		created_at: new Date(user.created_at),
		provider_id: providerFromRequest(user.provider_id),
	}
}

export type Users = Array<PartialUser>

export type PartialUserResponse = {
	created_at: string;
	email: string;
	email_verified: boolean;
	id: string;
	provider_id: string;
	state: UserState;
}

export type User = {
	id: string,
	display_name: string,
	email: string,
	email_verified: boolean,
	photo_url?: string,
	traits: Array<string>,
	data: Object,
	provider_id: Provider,
	created_at: Date,
	updated_at: Date,
	state: UserState,
	device_languages: Array<string>,
}

export type NewUser = {
	email: string;
	type: 'link' | 'password';
	password?: string;
}