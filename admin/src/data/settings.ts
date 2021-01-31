import {
	useEffect,
	useCallback,
	ChangeEvent,
	useState,
} from 'react'
import {
	atomFamily,
	useRecoilState,
	useSetRecoilState,
	useRecoilValue,
} from 'recoil'
import { CancelToken, useHttp, HttpError, getError } from 'data/http'

type SetterOrUpdater<T>
	= T
	| ((currentState: T) => T)

export enum EmailProvider {
	MailGun = 'mailgun',
	None = 'none',
}

export type MailGunSettings = {
	domain: string;
	from_email: string;
	from_name: string;
	api_key: string;
	username: string;
}

export type MailGun = {
	provider: typeof EmailProvider.MailGun;
	settings: {
		mailgun: MailGunSettings;
	};
}

export let DefaultMailGunSettings: MailGunSettings = {
	domain: '',
	from_email: '',
	from_name: '',
	api_key: '',
	username: 'api'
}

export let DefaultMailGun: MailGun = {
	provider: EmailProvider.MailGun,
	settings: {
		mailgun: DefaultMailGunSettings
	}
}

export type ProviderSettings
	= MailGun
	| { provider: typeof EmailProvider.None }
	| undefined


export function hasEmailProvider(settings: ProviderSettings) {
	if (!settings) {
		return false
	}

	if (settings.provider === EmailProvider.None) {
		return false
	}

	return true
}


type Request<T> = {
	data: T | undefined,
	loading: boolean,
	error: HttpError | null,
	initialData: T | undefined,
}


let createEmailSettings = atomFamily<Request<ProviderSettings>, string>({
	key: 'email_settings',
	default: {
		data: undefined,
		initialData: undefined,
		loading: true,
		error: null,
	}
})

export function useEmailSettings(project: string): [Request<ProviderSettings>, ((x: SetterOrUpdater<ProviderSettings>) => void)] {
	let http = useHttp()

	let [state, setState] = useRecoilState(createEmailSettings(project))

	function handleSetState(valOrFn: SetterOrUpdater<ProviderSettings>) {
		setState(currentState => {
			let nextState = valOrFn instanceof Function
				? valOrFn(currentState.data)
				: (valOrFn as ProviderSettings)

			return {
				...currentState,
				data: nextState!
			}
		})
	}

	useEffect(() => {

		setState(state => {
			return {
				...state,
				loading: true,
				error: null
			}
		})

		let source = CancelToken.source()
		let options = {
			cancelToken: source.token,
			params: { project }
		}

		http
			.get<ProviderSettings>('settings/email', options)
			.then(res => {
				setState({
					data: res.data,
					initialData: res.data,
					loading: false,
					error: null,
				})
			})
			.catch(err => setState(state => {
				return {
					...state,
					loading: false,
					error: getError(err)
				}
			}))

		return () => {
			source.cancel()
		}

	}, [project])

	return [state, handleSetState]
}

export function useSetEmailSettings(project: string) {
	let atom = createEmailSettings(project)
	let setState = useSetRecoilState<Request<ProviderSettings>>(atom)

	return useCallback((e: ChangeEvent<HTMLInputElement>) => {
			setState(state => {

				if (state.data === undefined) {
					return state
				}

				if (state.data.provider === EmailProvider.None) {
					return state
				}

				let { provider } = state.data
				let settings = state.data.settings[provider]
				let { name, value } = e.target
				return {
					...state,
					data: {
						...state.data,
						settings: {
							[provider]: {
								...state.data.settings[provider],
								[name]: value
							}
						}
					}
				}
			})
	}, [setState])
}

export function useSaveEmailSettings(project: string) {
	let http = useHttp()

	let [state, setState] = useState<{ loading: boolean; error: HttpError | null }>({
		loading: false,
		error: null
	})

	let atom = createEmailSettings(project)
	let { data } = useRecoilValue(atom)

	let handler = useCallback(async () => {
		setState({ loading: true, error: null })

		try {
			await http.post('settings/email', data, {
				params: { project },
			})

			setState({ loading: false, error: null })
		} catch (err) {
			setState({ loading: false, error: getError(err) })
		}

	}, [project, data, http])

	return { handler, ...state }
}