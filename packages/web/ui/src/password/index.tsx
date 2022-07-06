import { ChangeEvent, SyntheticEvent, useState } from 'react'
import { useNavigate, useMatch, Link, Navigate } from 'react-router-dom'
import { ErrorCode, Flag, UserState } from '@vulpo-dev/auth-sdk'
import { useAuth } from '@vulpo-dev/auth-react'

import { Input, Password as PasswordInput } from '../component/input'
import { Button, IconButton } from '../component/button'
import { useTranslation, useError } from '../context/translation'
import { useConfig, useFlags } from '../context/config'
import { Disclaimer } from '../component/disclaimer'
import { checkPasswordLength, useForm } from '../utils'
import Card from '../component/card'

type Form = {
	email: string;
	password: string;
}

export enum Ctx {
	SignIn = 'signin',
	SignUp = 'signup',
}

export type Props = {
	onBack: () => void;
	onSubmit: (user: Form) => void;
	ctx: Ctx;
	loading: boolean;
	error: null | ErrorCode;
}

export let Password = ({ onSubmit, onBack, ctx, loading, error }: Props) => {
	let config = useConfig()
	let flags = useFlags()

	let withBack = (
		flags.includes(Flag.AuthenticationLink) ||
		flags.includes(Flag.OAuthGoogle)
	)

	let withPasswordReset = flags.includes(Flag.PasswordReset)
	let withNavLink = (
		flags.includes(Flag.SignIn) &&
		flags.includes(Flag.SignUp)
	)

	let [form, setForm] = useForm<Form>({
		email: '',
		password: ''
	})

	let t = useTranslation()

	function validatePassword(elm: HTMLInputElement) {
		checkPasswordLength(elm, t.error)
	}

	function setPassword(e: ChangeEvent<HTMLInputElement>) {
		validatePassword(e.target)
		setForm(e)
	}

	function handleSubmit(e: SyntheticEvent) {
		e.preventDefault()
		onSubmit(form)
	}

	let button = ctx === Ctx.SignIn
		? t.signin.label
		: t.signup.label

	let navLink = ctx === Ctx.SignIn
		? Ctx.SignUp
		: Ctx.SignIn

	let linkLabel = ctx === Ctx.SignIn
		? t.signup.nav
		: t.signin.nav

	let errorMessage = useError(error)

	if (!flags.includes(Flag.EmailAndPassword)) {
		return <Navigate to={`/${config.basename}`} />
	}

	return (
		<Card className="vulpo-auth-password">
			<header className="vulpo-card-header">
				<div className="vulpo-auth-card-nav vulpo-auth-card-nav--spaced">
					<section>
						{ withBack &&
							<IconButton id="back" aria-label={button} onClick={() => onBack()}>
								{ config.Arrow }
							</IconButton>
						}
						<label htmlFor="back">{button}</label>
					</section>

					{ withNavLink &&	
						<section>
							<small>
								<Link to={`/${config.basename}/${navLink}/email`}>{linkLabel}</Link>
							</small>
						</section>
					}
				</div>
				<h3 className="vulpo-auth-card-title">{t.password.title}</h3>
			</header>

			<form className="vulpo-auth-password-form" onSubmit={handleSubmit}>
				<section className="vulpo-auth-password-section">
					<label className="vulpo-auth-label" htmlFor="email">{t.label.email}</label>
					<Input
						id="email"
						name='email'
						type='email'
						value={form.email}
						onChange={setForm}
						required
						autoFocus
					/>
				</section>

				<section className="vulpo-auth-password-password-section">
					<label className="vulpo-auth-label" htmlFor="password">{t.label.password}</label>
					<PasswordInput
						ref={elm => elm && validatePassword(elm)}
						id="password"
						name="password"
						autoComplete={ctx === 'signin' ? 'current-password' : 'new-password'}
						type='password'
						value={form.password}
						onChange={setPassword}
						required
					/>
					{	
						(ctx === 'signin' && withPasswordReset) &&
						<Link className="vulpo-auth-password-forgot-password" to={`/${config.basename}/forgot-password`}>
							<small>{t.password.forgot}</small>
						</Link>
					}
				</section>

				<section className="vulpo-auth-password-section">
					<Button loading={loading}>{button}</Button>
				</section>

				{ error &&
					<p className="vulpo-auth-password-error test-error">
						{errorMessage}
					</p>
				}
			</form>

			<div className="vulpo-auth-divider" />

			<footer className="vulpo-auth-footer">
				<Disclaimer  />
			</footer>
		</Card>
	)
}

type ContainerProps = {
	redirect?: boolean;
	redirectTo?: string;
}

let PasswordContainer = ({ redirect = true, redirectTo }: ContainerProps) => {
	let navigate = useNavigate()
	let { basename } = useConfig()
	let [error, setError] = useState<ErrorCode | null>(null)
	let [loading, setLoading] = useState<boolean>(false)
	let match = useMatch(`${basename}/:type/*`)
	let auth = useAuth()

	function handleBack() {
		if (match) {
			navigate(`/${basename}/${match.params.type}`, { replace: true })
		} else {
			navigate(`/${basename}/`, { replace: true })
		}
	}

	async function handleSubmit(form: Form) {
		if (!match?.params?.type) {
			return
		}

		setError(null)
		setLoading(true)

		try {
			let user = match?.params?.type === Ctx.SignIn
				? await auth.signIn(form.email, form.password)
				: await auth.signUp(form.email, form.password)

			if (redirect && user.state === UserState.SetPassword) {
				navigate(redirectTo ?? `/${basename}/user/set_password`, { replace: true })
			}
		} catch (err: any) {
			setLoading(false)
			setError(err.code)
		}
	}

	let ctx = match?.params?.type as Ctx | undefined

	return (
		<Password
			onBack={handleBack}
			onSubmit={handleSubmit}
			ctx={ctx ?? Ctx.SignIn}
			loading={loading}
			error={error}
		/>
	)
}

export default PasswordContainer
