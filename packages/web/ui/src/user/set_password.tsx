import React from 'react'
import { SyntheticEvent, FC, useState } from 'react'
import { Password } from '@biotic-ui/input'
import { Button } from '@biotic-ui/button'
import { useForm } from '@biotic-ui/std'
import { ErrorCode } from '@riezler/auth-sdk'
import { useAuth } from '@riezler/auth-react'
import { Link } from 'react-router-dom'

import { checkPasswordLength, BASELINE } from '../utils'
import { useTranslation, useError } from '../context/translation'

type Form = {
	password1: string;
	password2: string;
}

export type Props = {
	loading: boolean;
	error: null | ErrorCode;
	onSubmit: (f: Form) => void;
}

export let SetPassword: FC<Props> = ({ 
	loading = false,
	error,
	onSubmit,
}) => {
	let [form, setForm] = useForm<Form>({
		password1: '',
		password2: '',
	})

	let t = useTranslation()
	let errorMessage = useError(error)

	function setPassword1(e: SyntheticEvent) {
		let target = (e.target as HTMLInputElement)
		checkPasswordLength(target, t.error)
		setForm(e)
	}

	function setPassword2(e: SyntheticEvent<HTMLInputElement>) {
		let target = (e.target as HTMLInputElement)

		if (form.password1 !== target.value) {
			target.setCustomValidity(t.error.password_mismatch)
		} else {
			target.setCustomValidity('')
		}

		setForm(e)
	}

	function handleSubmit(e: SyntheticEvent) {
		e.preventDefault()
		onSubmit(form)
	}

	let tokenError = (
		error === ErrorCode.ResetInvalidToken ||
		error === ErrorCode.ResetTokenNotFound ||
		error === ErrorCode.ResetExpired
	)

	return (
		<div className="vulpo-auth vulpo-auth-card vulpo-auth-user-set-password">
			<header className="vulpo-card-header">
				<h3 className="vulpo-auth-card-title">{t.set_password.title}</h3>
			</header>
			
			{ tokenError &&
				<section className="vulpo-auth-form-section">
					<p className="vulpo-auth-error">{errorMessage}</p>
					<Link className="vulpo-auth-user-set-password-overview" to='/'>Overview</Link>
				</section>
			}

			<form onSubmit={handleSubmit}>
				<section className="vulpo-auth-form-section">
					<label className="vulpo-auth-label" htmlFor="password1">{t.set_password.new_password}</label>
					<Password
						id="password1"
						name='password1'
						autoComplete='new-password'
						value={form.password1}
						onChange={setPassword1}
						disabled={loading || tokenError}
						required
						autoFocus
					/>
				</section>
				
				<section className="vulpo-auth-form-section">
					<label className="vulpo-auth-label" htmlFor="password2">{t.set_password.repeat_password}</label>
					<Password
						id="password2"
						name='password2'
						value={form.password2}
						onChange={setPassword2}
						disabled={loading || tokenError}
						required
					/>
				</section>

				<section className="vulpo-auth-form-section">
					<Button className="vulpo-auth-button" loading={loading} disabled={tokenError}>
						{t.set_password.button_label}
					</Button>
				</section>

				{ (error && ! tokenError) &&
					<p className="vulpo-auth-error">{errorMessage}</p>
				}

			</form>
		</div>
	)
}

let SetPasswordContainer = () => {
	let auth = useAuth()

	let [error, setError] = useState<ErrorCode | null>(null)
	let [loading, setLoading] = useState<boolean>(false)

	async function handleSubmit(form: Form) {
		setLoading(true)
		setError(null)

		try {
			await auth.setPassword(form.password1)
		} catch(err) {
			setLoading(false)
			setError(err.code)
		}
	}

	return (
		<SetPassword
			onSubmit={handleSubmit}
			loading={loading}
			error={error}
		/>
	)
}

export default SetPasswordContainer
