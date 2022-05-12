import React from 'react'
import { SyntheticEvent, useState } from 'react'
import { ErrorCode, Flag } from '@riezler/auth-sdk'
import { useNavigate, useMatch } from 'react-router-dom'
import { useAuth } from '@riezler/auth-react'

import { useForm } from '../utils'
import { Input } from '../component/input'
import { Button, IconButton } from '../component/button'
import { useConfig, useFlags } from '../context/config'
import { useTranslation, useError } from '../context/translation'
import { Disclaimer } from '../component/disclaimer'
import Card from '../component/card'

type Form = {
	email: string
}

type Props = {
	loading: boolean;
	error: null | ErrorCode;
	onBack: () => void;
	onSignIn: (form: Form) => void;
	ctx: 'signin' | 'signup';
}

export let EnterEmail = (props: Props) => {

	let config = useConfig()
	let t = useTranslation()
	let errorMessage = useError(props.error)

	let flags = useFlags()

	let withBack = (
		flags.includes(Flag.EmailAndPassword) ||
		flags.includes(Flag.OAuthGoogle)
	)

	let [form, setForm] = useForm<Form>({
		email: ''
	})

	function handleSubmit(e: SyntheticEvent) {
		e.preventDefault()
		props.onSignIn(form)
	}

	let label = props.ctx === 'signin'
		? t.signin.label
		: t.signup.label

	return (
		<Card className="vulpo-auth-passwordless">
			<div className="vulpo-auth-card-nav">
				{ withBack &&
					<IconButton id='back' onClick={props.onBack}>
						{ config.Arrow }				
					</IconButton>
				}
				<label htmlFor="back">{label}</label>
			</div>
			<header className="vulpo-card-header">
				<h3 className="vulpo-auth-card-title vulpo-auth-title">{t.passwordless.title}</h3>
				<p className="vulpo-auth-subtitle">
					<t.passwordless.info label={label} />
				</p>
			</header>
			<form onSubmit={handleSubmit}>
				<section className="vulpo-auth-section">
					<label className="vulpo-auth-label" htmlFor="email">{t.label.email}</label>
					<Input
						id="email"
						name='email'
						type='email'
						disabled={props.loading}
						value={form.email}
						onChange={setForm}
						required
						autoFocus
					/>
				</section>

				<section className="vulpo-auth-section">
					<Button loading={props.loading}>{t.passwordless.button}</Button>
				</section>

				{ props.error &&
					<p className="vulpo-auth-error">{errorMessage}</p>
				}
			</form>

			<div className="vulpo-auth-divider" />

			<footer className="vulpo-auth-footer">
				<Disclaimer  />
			</footer>
		</Card>
	)
}


let EnterEmailContainer = () => {
	let auth = useAuth()
	let navigate = useNavigate()
	let { basename } = useConfig()
	let match = useMatch(`${basename}/:type/*`)

	let [error, setError] = useState<ErrorCode | null>(null)
	let [loading, setLoading] = useState<boolean>(false)

	function handleBack() {
		if (match) {
			navigate(`/${basename}/${match.params.type}`, { replace: true })
		} else {
			navigate(`/${basename}`, { replace: true })
		}
	}

	async function handleSignIn(form: Form) {
		setLoading(true)
		setError(null)

		try {
			let { id, session } = await auth.passwordless(form.email)
			navigate(`/${basename}/signin/link/check-email?id=${id}&session=${session}`)
		} catch (err) {
			setLoading(false)
			setError(err.code)
		}
	}

	let ctx = match?.params.type as 'signin' | 'signup' | undefined
	return (
		<EnterEmail
			loading={loading}
			error={error}
			onBack={handleBack}
			onSignIn={handleSignIn}
			ctx={ctx ?? 'signin'}
		/>
	)
}

export default EnterEmailContainer
