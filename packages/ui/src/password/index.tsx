import React from 'react'
import { SyntheticEvent, useState } from 'react'
import styled from 'styled-components'
import { Card, CardHeader, CardNav, CardTitle } from 'component/card'
import { Input, Password as PasswordInput } from '@biotic-ui/input'
import { useForm } from '@biotic-ui/std'
import { Button, IconButton } from '@biotic-ui/button'
import { useTranslation, useError } from 'context/translation'
import { useConfig, useFlags } from 'context/config'
import { useHistory, useRouteMatch, Link, useLocation, Redirect } from 'react-router-dom'
import { Label } from 'component/text'
import { Disclaimer } from 'component/disclaimer'
import { Footer, Divider } from 'component/layout'
import { ErrorCode, Flag } from '@riezler/auth-sdk'
import { useAuth } from '@riezler/auth-react'
import { checkPasswordLength } from 'utils'

type Form = {
	email: string;
	password: string;
}

export type Props = {
	onBack: () => void;
	onSubmit: (user: Form) => void;
	ctx: 'signin' | 'signup';
	loading: boolean;
	error: null | ErrorCode;
}

export let Password = ({ onSubmit, onBack, ctx, loading, error }: Props) => {
	let config = useConfig()
	let flags = useFlags()

	let withBack = flags.includes(Flag.AuthenticationLink)
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

	function setPassword(e: SyntheticEvent) {
		let target = (e.target as HTMLInputElement)
		checkPasswordLength(target, t.error)
		setForm(e)
	}

	function handleSubmit(e: SyntheticEvent) {
		e.preventDefault()
		onSubmit(form)
	}

	let button = ctx === 'signin'
		? t.signin.label
		: t.signup.label

	let navLink = ctx === 'signin'
		? 'signup'
		: 'signin'

	let linkLabel = ctx === 'signin'
		? t.signup.nav
		: t.signin.nav

	let errorMessage = useError(error)

	if (!flags.includes(Flag.EmailAndPassword)) {
		return <Redirect to='/' />
	}

	return (
		<Card>
			<CardHeader>
				<StyledCardNav>
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
								<Link to={`/${navLink}/email`}>{linkLabel}</Link>
							</small>
						</section>
					}
				</StyledCardNav>
				<CardTitle>{t.password.title}</CardTitle>
			</CardHeader>

			<Form onSubmit={handleSubmit}>
				<Section>
					<Label htmlFor="email">{t.label.email}</Label>
					<Input
						id="email"
						name='email'
						type='email'
						value={form.email}
						onChange={setForm}
						required
						autoFocus
					/>
				</Section>

				<PasswordSection>
					<Label htmlFor="password">{t.label.password}</Label>
					<PasswordInput
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
						<ForgotPassword to='/forgot-password'>
							<small>{t.password.forgot}</small>
						</ForgotPassword>
					}
				</PasswordSection>

				<Section>
					<Button loading={loading}>{button}</Button>
				</Section>

				{ error &&
					<Error>{errorMessage}</Error>
				}
			</Form>

			<Divider />

			<Footer>
				<Disclaimer  />
			</Footer>
		</Card>
	)
}

let PasswordContainer = () => {
	let history = useHistory()
	let location = useLocation()

	let [error, setError] = useState<ErrorCode | null>(null)
	let [loading, setLoading] = useState<boolean>(false)
	let match = useRouteMatch<{ type: 'signin' | 'signup' }>('/:type')
	let auth = useAuth()

	function handleBack() {
		if (match) {
			history.replace(`/${match.params.type}`)
		} else {
			history.replace('/')
		}
	}

	async function handleSubmit(user: Form) {
		if (!match) {
			return
		}

		setError(null)
		setLoading(true)

		try {
			if (match.params.type === 'signin') {
				await auth.signIn(user.email, user.password)
			} else {
				await auth.signUp(user.email, user.password)
			}
			// setLoading(false)
		} catch (err) {
			console.log({ err })
			setLoading(false)
			setError(err.code)
		}
	}

	return (
		<Password
			onBack={handleBack}
			onSubmit={handleSubmit}
			ctx={match?.params?.type ?? 'signin'}
			loading={loading}
			error={error}
		/>
	)
}

export default PasswordContainer


let Section = styled.section`
	margin-block-end: var(--baseline-2);
	display: flex;
	flex-direction: column;
`

let PasswordSection = styled.section`
	margin-block-end: calc(var(--baseline) * 2.5);
	display: flex;
	flex-direction: column;

	input {
		margin-block-end: var(--baseline-half);
	}
`

let ForgotPassword = styled(Link)`
	margin-inline-start: auto;
`

let Error = styled.p`
	text-align: center;
	color: var(--red);
	margin-block-end: calc(var(--baseline) * 1.125);
`

let Form = styled.form`
	margin-block-start: calc(var(--baseline) * -0.625);
`

let StyledCardNav = styled(CardNav)`
	justify-content: space-between;
	
	section {
		display: flex;
	}
`