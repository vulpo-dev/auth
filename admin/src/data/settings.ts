import {
	useCallback,
	ChangeEvent,
	useState,
} from 'react'

import {
	bosonFamily,
	useSetBoson,
	useBosonValue,
	useQuery,
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

let createEmailSettings = bosonFamily<[string], EmailSettings>(() => {
	return {
		defaultValue: DefaultEmailSettings
	}
})

export function useEmailSettings(project: string) {
	let http = useHttp()

	return useQuery(createEmailSettings(project), async () => {
		let res = await http.get<EmailSettings | null>('settings/email', {
			params: { project_id: project }
		})

		return res.data ?? DefaultEmailSettings
	})
}

export function useSetEmailSettings(project: string) {
	let setState = useSetBoson<EmailSettings>(createEmailSettings(project))
	return useCallback((e: ChangeEvent<HTMLInputElement>) => {
			setState((state) => {
				let { name, value } = e.target
				return {
					...state,
					[name]: value
				}
			})
	}, [setState])
}

export function useSaveEmailSettings(project: string) {
	let http = useHttp()

	let [state, setState] = useState<{ loading: boolean; error: ApiError | null }>({
		loading: false,
		error: null
	})

	let data = useBosonValue(createEmailSettings(project))

	let handler = useCallback(async () => {
		setState({ loading: true, error: null })

		let settings = {
			...data,
			port: typeof data?.port === 'string' ? parseInt(data.port, 10) : (data?.port ?? 465)
		}

		try {
			await http.post('settings/email', settings, {
				params: { project_id: project },
			})

			setState({ loading: false, error: null })
		} catch (err) {
			setState({ loading: false, error: getErrorCode(err) })
		}

	}, [project, data, http])

	return { handler, ...state }
}

export type ProjectSettings = {
	id: string;
	name: string;
	domain: string;
}

export function useSetProjectSettings() {
	let http = useHttp()
	let [loading, setLoading] = useState<boolean>(false)
	let [error, setError] = useState<ApiError | null>(null)

	let run = useCallback(async (settings: ProjectSettings) => {
		try {
			setLoading(true)

			let payload = {
				project: settings.id,
				name: settings.name,
				domain: settings.domain,
			}

			await http.post('/settings/project', payload)
			setLoading(false)
		} catch (err) {
			setLoading(false)
			setError(getErrorCode(err))
		}
	}, [setLoading, setError, http])

	return { run, loading, error }
}
