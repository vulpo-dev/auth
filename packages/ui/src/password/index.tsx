import React, { ChangeEvent } from 'react'
import { SyntheticEvent, useState } from 'react'
import styled from 'styled-components'
import { Input, Password as PasswordInput } from '@biotic-ui/input'
import { useForm } from '@biotic-ui/std'
import { Button, IconButton } from '@biotic-ui/button'
import { useHistory, useRouteMatch, Link, useLocation, Redirect } from 'react-router-dom'
import { ErrorCode, Flag } from '@riezler/auth-sdk'
import { useAuth } from '@riezler/auth-react'

import { Card, CardHeader, CardNav, CardTitle } from '../component/card'
import { useTranslation, useError } from '../context/translation'
import { useConfig, useFlags } from '../context/config'
import { Label } from '../component/text'
import { Disclaimer } from '../component/disclaimer'
import { Footer, Divider } from '../component/layout'
import { checkPasswordLength } from '../utils'

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

type ContainerProps = {
	redirect?: boolean;
	redirectTo?: string;
}

let PasswordContainer = ({ redirect = true, redirectTo }: ContainerProps) => {
	let history = useHistory()
	let location = useLocation()

	let [error, setError] = useState<ErrorCode | null>(null)
	let [loading, setLoading] = useState<boolean>(false)
	let match = useRouteMatch<{ type: Ctx }>('/:type')
	let auth = useAuth()

	function handleBack() {
		if (match) {
			history.replace(`/${match.params.type}`)
		} else {
			history.replace('/')
		}
	}

	async function handleSubmit(form: Form) {
		if (!match?.params?.type) {
			return
		}

		setError(null)
		setLoading(true)

		try {
			let user = Ctx.SignIn
				? await auth.signIn(form.email, form.password)
				: await auth.signUp(form.email, form.password)

			if (redirect && user.state === 'SetPassword') {
				history.replace(redirectTo ?? '/user/set_password')
			}
		} catch (err) {
			setLoading(false)
			setError(err.code)
		}
	}

	return (
		<Password
			onBack={handleBack}
			onSubmit={handleSubmit}
			ctx={match?.params?.type ?? Ctx.SignIn}
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