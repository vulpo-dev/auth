import {
	useCallback,
	ChangeEvent,
} from 'react'

import {
	bosonFamily,
	useSetBoson,
	useBosonValue,
	useQuery,
	usePost,
} from '@biotic-ui/boson'

import { useHttp } from 'data/http'
import { ApiError, getErrorCode } from 'error'

export type EmailSettings = {
	host: string;
	from_email: string;
	from_name: string;
	api_key: string;
	username: string;
	password: string;
	port: number | string;
}

export let DefaultEmailSettings: EmailSettings = {
	host: '',
	from_email: '',
	from_name: '',
	api_key: '',
	username: '',
	password: '',
	port: 465
}


export function hasEmailProvider(settings?: EmailSettings | null) {
	if (!settings) {
		return false
	}

	return true
}

let createEmailSettings = bosonFamily<[string], EmailSettings | null>(() => {
	return {
		defaultValue: null
	}
})

export function useEmailSettings(project: string) {
	let http = useHttp()

	return useQuery(createEmailSettings(project), async () => {
		let res = await http.get<EmailSettings | null>('settings/email', {
			params: { project_id: project }
		})

		return res.data
	})
}

export function useSetEmailSettings(project: string) {
	let setState = useSetBoson<EmailSettings | null>(createEmailSettings(project))
	return useCallback((e: ChangeEvent<HTMLInputElement>) => {
			setState((state) => {
				let { name, value } = e.target
				return {
					...(state ?? DefaultEmailSettings),
					[name]: value
				}
			})
	}, [setState])
}

export function useSaveEmailSettings(project: string) {
	let http = useHttp()
	let data = useBosonValue(createEmailSettings(project))
	return usePost<void, ApiError>(async () => {

		let settings = {
			...data,
			port: typeof data?.port === 'string' ? parseInt(data.port, 10) : (data?.port ?? 465)
		}

		await http
			.post('settings/email', settings, {
				params: { project_id: project },
			})
			.catch(err => Promise.reject(getErrorCode(err)))
	})
}

export type ProjectSettings = {
	id: string;
	name: string;
	domain: string;
}

export function useSetProjectSettings() {
	let http = useHttp()
	return usePost<void, ApiError>(async (settings: ProjectSettings) => {
		let payload = {
			project: settings.id,
			name: settings.name,
			domain: settings.domain,
		}

		await http
			.post('/settings/project', payload)
			.catch(err => Promise.reject(getErrorCode(err)))
	})
}
