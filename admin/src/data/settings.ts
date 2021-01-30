import { useEffect } from 'react'
import { atomFamily, useRecoilState } from 'recoil'
import { CancelToken, useHttp, HttpError, getError } from 'data/http'

type SetterOrUpdater<T>
	= T
	| ((currentState: T) => T)

export enum EmailProvider {
	MailGun = 'mailgun',
	None = 'none',
}

export type MailGun = {
	provider: typeof EmailProvider.MailGun;
	settings: {
		mailgun: {
			domain: string;
			from_email: string;
			from_name: string;
			api_key: string;
			username: string;
		};
	};
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
}


let createEmailSettings = atomFamily<Request<ProviderSettings>, string>({
	key: 'email_settings',
	default: {
		data: undefined,
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