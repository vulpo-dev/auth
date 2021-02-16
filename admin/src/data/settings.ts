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

export type EmailSettings = {
	host: string;
	from_email: string;
	from_name: string;
	api_key: string;
	username: string;
	password: string;
	port: number;
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


type Request<T> = {
	data: T | undefined,
	loading: boolean,
	error: HttpError | null,
	initialData: T | undefined | null,
}


let createEmailSettings = atomFamily<Request<EmailSettings>, string>({
	key: 'email_settings',
	default: {
		data: undefined,
		initialData: undefined,
		loading: true,
		error: null,
	}
})

export function useEmailSettings(project: string): [Request<EmailSettings>, ((x: SetterOrUpdater<EmailSettings>) => void)] {
	let http = useHttp()

	let [state, setState] = useRecoilState(createEmailSettings(project))

	function handleSetState(valOrFn: SetterOrUpdater<EmailSettings>) {
		setState(currentState => {
			let nextState = valOrFn instanceof Function
				? valOrFn(currentState.data ?? DefaultEmailSettings)
				: (valOrFn as EmailSettings)

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
			.get<EmailSettings | null>('settings/email', options)
			.then(res => {
				setState({
					data: res.data ?? DefaultEmailSettings,
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
	let setState = useSetRecoilState<Request<EmailSettings>>(atom)

	return useCallback((e: ChangeEvent<HTMLInputElement>) => {
			setState(state => {
				let { name, value } = e.target
				return {
					...state,
					data: {
						...(state.data ?? DefaultEmailSettings),
						[name]: value
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