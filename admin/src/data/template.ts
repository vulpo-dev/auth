import { useEffect, useCallback, useState, FormEvent } from 'react'
import { bosonFamily, useQuery } from '@biotic-ui/boson'
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

let getTemplate = bosonFamily<[string, TemplateType], Template | undefined>(() => {
	return {
		defaultValue: undefined
	}
})

export function useTemplate(project: string, template: TemplateType) {
	let http = useHttp()

	return useQuery(getTemplate(project, template), async () => {
		let options = {
			params: { project_id: project, template }
		}

		let res = await http.get<Template>('/template/', options)
		return res.data
	})
}

export function useSaveTemplate(project: string, template: TemplateType) {
	let http = useHttp()
	let [value, action] = useTemplate(project, template)
	let [loading, setLoading] = useState(false)
	let [error, setError] = useState<ApiError | null>(null)
	
	let save = useCallback(async (e: FormEvent) => {
		e.preventDefault()
		
		try {
			setLoading(true)
			await http.post('/template/', {
				...value.data,
				name: value.data?.of_type,
				
			})
			action.reload()
		} catch (err) {
			setLoading(false)
			setError(getErrorCode(err))
		}
	}, [value])

	return { save, loading, error }
}
