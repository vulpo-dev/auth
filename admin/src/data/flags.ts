import { useCallback } from 'react'

import {
	bosonFamily,
	useSetBoson,
	useQuery,
	usePost,
} from '@biotic-ui/boson'

import { useHttp } from 'data/http'

export enum Flags {
	SignIn = 'auth::signin',
	SignUp = 'auth::signup',
	PasswordReset = 'action::password_reset',
	VerifyEmail = 'action::verify_email',
	
	EmailAndPassword = 'method::email_password',
	AuthenticationLink = 'method::authentication_link',

	OAuthGoogle = 'oauth::google',
}

export function isFlag(flag: string | Flags): boolean {
	let index = Object.values(Flags).findIndex(value => {
		return value === flag
	})

	return index !== -1
}

export function getFlagsFromRequest(flags: Array<string>): Array<Flags> {
	let items = flags
		.filter(flag => isFlag(flag))

	return (items as Array<Flags>)
}


type ProjectFlags = Array<Flags>

type Response = {
	items: Array<string>
}


let flagsFamily = bosonFamily<[string], ProjectFlags>(() => {
	return {
		defaultValue: []
	}
})

export function useFlags(project: string) {
	let http = useHttp()

	return useQuery(flagsFamily(project), async () => {
		let res = await http.get<Response>('project/flags',  {
			params: {
				project
			}
		})

		return getFlagsFromRequest(res.data.items)
	})
}

export function useToggleFlags(project: string) {
	let setState = useSetBoson(flagsFamily(project))
	
	let set = useCallback((flag: Flags) => () => {
		setState((items = []) => {
			if (items.includes(flag) && flag === Flags.EmailAndPassword) {
				return items.filter(f => (
					f !== Flags.EmailAndPassword &&
					f !== Flags.PasswordReset &&
					f !== Flags.VerifyEmail
				))
			}

			if (items.includes(flag)) {
				return items.filter(f => f !== flag)
			}

			return items.concat([flag])
		})
	}, [setState])

	return set
}


type UpdateFlags = {
	project: string;
	flags: Array<Flags>;
}

export function useUpdateFlags(project: string) {
	let http = useHttp()
	return usePost(async (flags: Array<Flags>) => {
		let payload: UpdateFlags = { project, flags }
		await http.post<void>('project/set_flags', payload)
	})
}