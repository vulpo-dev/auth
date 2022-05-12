import { ErrorMessage } from 'context/translation'
import { Dispatch, FormEvent, FunctionComponent, SetStateAction, useMemo, useState } from 'react'
import { RouteProps } from 'react-router-dom'

export type WithClass = {
	className?: string;
}

export let withClass = (baseClass: string) => ({ className = '' }: WithClass) => {
	return {
		className: `${baseClass} ${className}`
	}
}

type Messages = Pick<ErrorMessage,
	'password_min_length' |
	'password_max_length'
>

export function checkPasswordLength(elm: HTMLInputElement, t: Messages) {
	let len = elm.value.length
	if (len < 8) {
		elm.setCustomValidity(t.password_min_length)
	} else if (len > 64) {
		elm.setCustomValidity(t.password_max_length)
	} else {
		elm.setCustomValidity('')
	}
}

export function useQueryParams(queryString: string) {
	return useMemo(() => {
		let searchParams = new URLSearchParams(queryString)
		return searchParams
	}, [queryString])
}

type FormHook<T> =
	[ T
	, (e: FormEvent) => void
	, Dispatch<SetStateAction<T>>
	]

export function useForm<T>(initalData: T): FormHook<T> {
	let [form, setForm] = useState<T>(initalData)
	
	function handleChange(e: FormEvent) {
		let { name, value } = (e.target as HTMLInputElement)
		setForm({
			...form,
			[name]: value
		})
	}

	return [form, handleChange, setForm]
}

export let PublicRoute: FunctionComponent<RouteProps> = () => {
	return null
}

export let PrivateRoute: FunctionComponent<RouteProps> = () => {
	return null
}
