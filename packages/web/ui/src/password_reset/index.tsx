import React from 'react'
import { SyntheticEvent, useState } from 'react'
import { ErrorCode, Flag } from '@vulpo-dev/auth-sdk'
import { useNavigate, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@vulpo-dev/auth-react'

import { useForm, useQueryParams } from '../utils'
import { Input } from '../component/input'
import { Button, IconButton } from '../component/button'
import { useTranslation, useError } from '../context/translation'
import { useConfig, useFlags } from '../context/config'

import CheckEmail from './check'
import SetPassword from './set_password'
import Card from '../component/card'

type Form = {
	email: string;
}

export type Props = {
	onBack: () => void;
	onReset: (f: Form) => void;
	loading: boolean;
	error: null | ErrorCode;
}

export let PasswordReset: React.FC<Props> = ({
	onBack,
	onReset,
	loading = false,
	error
}) => {
	let location = useLocation()
	let params = useQueryParams(location.search)
	let [form, setForm] = useForm<Form>({ email: params.get('email') ?? '' })
	
	let t = useTranslation()
	let config = useConfig()
	let errorMessage = useError(error)

	let handleSubmit = (e: SyntheticEvent) => {
		e.preventDefault()
		onReset(form)
	}

	return (
		<Card className="vulpo-auth-password-reset">
			<div className="vulpo-auth-card-nav">
				<IconButton
					id="back"
					aria-label={t.signin.label}
					onClick={() => onBack()}>
					{ config.Arrow }
				</IconButton>
				<label htmlFor="back">{t.signin.label}</label>
			</div>
			<header className="vulpo-card-header">
				<h3 className="vulpo-auth-card-title vulpo-auth-title">{t.reset_password.title}</h3>
				<p className="vulpo-auth-subtitle">{t.reset_password.info}</p>
			</header>
			<form onSubmit={handleSubmit}>
				<section className="vulpo-auth-password-reset-section">
					<label className="vulpo-auth-label" htmlFor="email">{t.label.email}</label>
					<Input
						id="email"
						name='email'
						type='email'
						disabled={loading}
						value={form.email}
						onChange={setForm}
						required
						autoFocus
					/>
				</section>

				<section className="vulpo-auth-password-reset-section">
					<Button loading={loading}>
						{t.reset_password.button}
					</Button>
				</section>

				{ error &&
					<p className="vulpo-auth-error">{errorMessage}</p>
				}
			</form>
		</Card>
	)
}

let PasswordResetContainer = () => {
	let auth = useAuth()

	let [error, setError] = useState<ErrorCode | null>(null)
	let [loading, setLoading] = useState<boolean>(false)

	let navigate = useNavigate()
	let { basename } = useConfig()

	async function handleReset(form: Form) {
		setError(null)
		setLoading(true)

		try {
			await auth.resetPassword(form.email)
			setLoading(false)

			navigate(`check-email?email=${encodeURIComponent(form.email)}`, { replace: true })
		} catch (err) {
			setLoading(false)
			setError(err.code)
		}
	}

	function handleBack() {
		navigate(`/${basename}/signin/email`, { replace: true })
	}

	return (
		<PasswordReset
			onBack={handleBack}
			onReset={handleReset}
			loading={loading}
			error={error}
		/>
	)
}


export default () => {
	let flags = useFlags()
	let { basename } = useConfig()

	if (!flags.includes(Flag.PasswordReset)) {
		return <Navigate to={basename} />
	}

	return (
		<Routes>
			<Route path='check-email' element={<CheckEmail />} />
			<Route path='set-password' element={<SetPassword />} />
			<Route path='/' element={<PasswordResetContainer />} />
		</Routes>
	)
}

