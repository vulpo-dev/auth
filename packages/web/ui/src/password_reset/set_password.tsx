import React from 'react'
import { SyntheticEvent, FC, useState, useEffect } from 'react'
import { ErrorCode } from '@riezler/auth-sdk'
import { useAuth } from '@riezler/auth-react'
import { useLocation, useHistory, Link } from 'react-router-dom'

import { Password } from '../component/input'
import { Button } from '../component/button'
import { Flow } from '../component/loading'
import { checkPasswordLength, useForm, useQueryParams  } from '../utils'
import { useTranslation, useError } from '../context/translation'

type Form = {
	password1: string;
	password2: string;
}

export type Props = {
	loading: boolean;
	error: null | ErrorCode;
	onSubmit: (f: Form) => void;
	verifyToken: boolean;
}

export let SetPassword: FC<Props> = ({ 
	loading = false,
	error,
	onSubmit,
	verifyToken,
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
		<div className="vulpo-auth vulpo-auth-card vulpo-auth-password-reset-set-password">
			<header className="vulpo-card-header">
				<h3 className="vulpo-auth-card-title">{t.set_password.title}</h3>
			</header>
			
			{ tokenError &&
				<section className="vulpo-auth-form-section">
					<p className="vulpo-auth-error">{errorMessage}</p>
					<Link className="vulpo-auth-password-reset-set-password-overview" to='/'>Overview</Link>
				</section>
			}


			{ verifyToken &&
				<div className="vulpo-auth-password-reset-set-password-loading">
					<Flow />
				</div>
			}


			{ !verifyToken &&

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
						<Button loading={loading} disabled={tokenError}>
							{t.set_password.button_label}
						</Button>
					</section>

					{ (error && ! tokenError) &&
						<p className="vulpo-auth-error">{errorMessage}</p>
					}

				</form>
			}
		</div>
	)
}

let SetPasswordContainer = () => {
	let auth = useAuth()
	let history = useHistory()
	let location = useLocation()
	let query = useQueryParams(location.search)

	let [error, setError] = useState<ErrorCode | null>(null)
	let [loading, setLoading] = useState<boolean>(false)
	let [verifyToken, setVerifyToken] = useState<boolean>(true)

	useEffect(() => {
		let id = query.get('id')
		let token = query.get('token')

		if (!id || !token) {
			setError(ErrorCode.ResetTokenNotFound)
			return
		}

		let sink = Promise.all([
			wait(2000),
			auth.verifyToken(id, token)
		])
		
		sink.then(() => setVerifyToken(false))
			.catch(err => {
				setVerifyToken(false)
				setError(err.code)
			})

	}, [])

	async function handleSubmit(form: Form) {

		let id = query.get('id')
		let token = query.get('token')

		if (!id || !token) {
			setError(ErrorCode.ResetTokenNotFound)
			return
		}

		setLoading(true)
		setError(null)

		try {
			await auth.setResetPassword({ ...form, id, token })
			history.replace('/signin/email')
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
			verifyToken={verifyToken}
		/>
	)
}

export default SetPasswordContainer

function wait(time: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, time)
	})
}
