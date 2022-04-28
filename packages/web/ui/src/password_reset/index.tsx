import React from 'react'
import { SyntheticEvent, useState } from 'react'
import { Input } from '@biotic-ui/input'
import { useForm, useQueryParams } from '@biotic-ui/std'
import { Button, IconButton } from '@biotic-ui/button'
import { ErrorCode, Flag } from '@riezler/auth-sdk'
import { useHistory, Switch, Route, Redirect, useLocation } from 'react-router-dom'
import { useAuth } from '@riezler/auth-react'

import { useTranslation, useError } from '../context/translation'
import { useConfig, useFlags } from '../context/config'

import CheckEmail from './check'
import SetPassword from './set_password'

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
		<div className="vulpo-auth vulpo-auth-card vulpo-auth-password-reset">
			<div className="vulpo-auth-card-nav">
				<IconButton
					className="vulpo-auth-icon-button"
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
					<Button
						className="vulpo-auth-button"
						loading={loading}>
						{t.reset_password.button}
					</Button>
				</section>

				{ error &&
					<p className="vulpo-auth-error">{errorMessage}</p>
				}
			</form>
		</div>
	)
}

let PasswordResetContainer = () => {
	let auth = useAuth()

	let [error, setError] = useState<ErrorCode | null>(null)
	let [loading, setLoading] = useState<boolean>(false)

	let history = useHistory()

	async function handleReset(form: Form) {
		setError(null)
		setLoading(true)

		try {
			await auth.resetPassword(form.email)
			setLoading(false)

			history.replace(`/forgot-password/check-email?email=${form.email}`)
		} catch (err) {
			setLoading(false)
			setError(err.code)
		}
	}

	function handleBack() {
		history.replace(`/signin/email`)
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

	if (!flags.includes(Flag.PasswordReset)) {
		return <Redirect to='/' />
	}

	return (
		<Switch>
			<Route path='/forgot-password/check-email'>
				<CheckEmail />
			</Route>

			<Route path='/forgot-password/set-password'>
				<SetPassword />
			</Route>
			
			<Route path='/forgot-password'>
				<PasswordResetContainer />
			</Route>
		</Switch>
	)
}

