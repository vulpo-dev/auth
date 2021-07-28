import { useEffect, useCallback, useState, FormEvent } from 'react'
import { bosonFamily, useBoson, useBosonValue } from '@biotic-ui/boson'
import { CancelToken, useHttp } from 'data/http'
import { ApiError, getErrorCode } from 'error'
import Axios from 'axios'

export enum TemplateType {
	ChangeEmail = "change_email",
	PasswordReset = "password_reset",
	Passwordless = "passwordless",
	VerifyEmail = "verify_email",
	Index = "index",
	Button = "button",
}

const TEMPLATE_VALUES = Object.values(TemplateType)
export function isTemplate(t: string): t is TemplateType {
	let index = TEMPLATE_VALUES.findIndex(val => val === t)
	return index !== -1
}

type Template = {
	from_name: string,
	subject: string,
	body: string,
	redirect_to: string,
	of_type: TemplateType,
	project_id: string,
	is_default: boolean,
	language: string,
}

type State = {
	initalValue: Template | undefined;
	currentValue: Template | undefined;
}

let getTemplate = bosonFamily<[string, TemplateType], State>(() => {
	return {
		key: 'template',
		defaultValue: {
			initalValue: undefined,
			currentValue: undefined,
		}
	}
})

type UseTemplate = [
	Template | undefined,
	(t: Template) => void,
	() => void,
	ApiError | null,
]

export function useTemplate(project: string, template: TemplateType): UseTemplate {
	let http = useHttp()

	let [state, setState] = useBoson(getTemplate(project, template))
	let [error, setError] = useState<ApiError | null>(null)

	useEffect(() => {

		let source = CancelToken.source()
		let options = {
			cancelToken: source.token,
			params: { project_id: project, template }
		}

		setError(null)
		http.get<Template>('/template/', options)
			.then(res => {
				setState(state => {
					return {
						initalValue: res.data,
						currentValue: {
							...res.data,
							...(state.currentValue ?? {})
						},
					}
				})
			})
			.catch(err => {
				if (Axios.isCancel(err)) {
					return
				}

				setError(getErrorCode(err))
			})

		return () => {
			source.cancel()
		}

	}, [project, template, http])

	let setValue = useCallback((t: Template) => {
		setState(state => {
			return {
				...state,
				currentValue: {
					...(state.currentValue ?? {}),
					...t,
				}
			}
		})
	}, [setState])

	let resetValue = useCallback(() => {
		setState(state => {
			return {
				...state,
				currentValue: state.initalValue,
			}
		})
	}, [setState])

	return [state.currentValue, setValue, resetValue, error]
}

export function useSaveTemplate(project: string, template: TemplateType) {
	let http = useHttp()
	let [value, setValue] = useBoson(getTemplate(project, template))
	let [loading, setLoading] = useState(false)
	let [error, setError] = useState<ApiError | null>(null)
	
	let save = useCallback(async (e: FormEvent) => {
		e.preventDefault()
		
		try {
			setLoading(true)
			await http.post('/template/', value.currentValue)
			setValue(state => {
				return {
					currentValue: state.currentValue,
					initalValue: state.currentValue,
				}
			})
		} catch (err) {
			setLoading(false)
			setError(getErrorCode(err))
		}
	}, [value])

	return { save, loading, error }
}