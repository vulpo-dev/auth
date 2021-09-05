import { useEffect, useState, useCallback } from 'react'

import {
	bosonFamily,
	useBoson,
	useSetBoson,
	useQuery,
} from '@biotic-ui/boson'

import { Reload } from 'types/utils'
import { CancelToken, useHttp } from 'data/http'
import { ApiError, getErrorCode } from 'error'
import { FastForwardCircle } from 'phosphor-react'

export enum Flags {
	SignIn = 'auth::signin',
	SignUp = 'auth::signup',
	PasswordReset = 'action::password_reset',
	VerifyEmail = 'action::verify_email',
	EmailAndPassword = 'method::email_password',
	AuthenticationLink = 'method::authentication_link',
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
	let [state, setState] = useBoson(flagsFamily(project))
	let [reload, setReload] = useState<boolean>(false)
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

type UpdateFlagsRequest = {
	loading: boolean;
	error: null | ApiError;
}

let updateFamily = bosonFamily<[string], UpdateFlagsRequest>(id => {
	return {
		defaultValue: {
			loading: false,
			error: null
		}
	}
})

type UseUpdateFlags = [
	(f: Array<Flags>) => Promise<void>,
	UpdateFlagsRequest,
]

export function useUpdateFlags(project: string): UseUpdateFlags {
	let http = useHttp()
	let [state, setState] = useState<UpdateFlagsRequest>({
		loading: false,
		error: null,
	})

	let update = useCallback(async (flags: Array<Flags>) => {

		setState({
			loading: true,
			error: null,
		})

		let payload: UpdateFlags = { project, flags }

		try {
			await http
				.post<void>('project/set_flags', payload)

			setState({
				loading: false,
				error: null,
			})

		} catch (err) {
			setState({
				loading: false,
				error: getErrorCode(err),
			})
		}

	}, [project, http, setState])

	return [update, state]
}