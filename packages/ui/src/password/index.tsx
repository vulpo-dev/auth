import React from 'react'
import { SyntheticEvent, useState } from 'react'
import styled from 'styled-components'
import { Card, CardHeader, CardNav, CardTitle } from 'component/card'
import { Input, Password as PasswordInput } from '@biotic-ui/input'
import { useForm, useQueryParams } from '@biotic-ui/std'
import { Button, IconButton } from '@biotic-ui/button'
import { useTranslation, useError } from 'context/translation'
import { useConfig } from 'context/config'
import { useHistory, useRouteMatch, Link, useLocation } from 'react-router-dom'
import { Label } from 'component/text'
import { Disclaimer } from 'component/disclaimer'
import { ErrorCode } from '@riezler/auth-sdk'
import { useAuth } from '@riezler/auth-react'
import { checkPasswordLength } from 'utils'

type UserForm = {
	email: string,
	password: string,
}

export type Props = {
	onBack: () => void;
	onSubmit: (user: UserForm) => void;
	ctx: 'signin' | 'signup';
	loading: boolean;
	error: null | ErrorCode;
}

export let Password = ({ onSubmit, onBack, ctx, loading, error }: Props) => {
	let config = useConfig()

	let [form, setForm] = useForm<UserForm>({
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

	let errorMessage = useError(error)

	return (
		<Card>
			<CardHeader>
				<CardNav>
					<IconButton id="back" aria-label={button} onClick={() => onBack()}>
						{ config.Arrow }
					</IconButton>
					<label htmlFor="back">{button}</label>
				</CardNav>
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
					/>
				</Section>

				<PasswordSection>
					<Label htmlFor="password">{t.label.password}</Label>
					<PasswordInput
						id="password"
						name='password'
						type='password'
						value={form.password}
						onChange={setPassword}
						required
					/>
					{	
						ctx === 'signin' &&
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

	let query = useQueryParams(location.search)

	let [error, setError] = useState<ErrorCode | null>(null)
	let [loading, setLoading] = useState<boolean>(false)
	let match = useRouteMatch<{ type: 'signin' | 'signup' }>('/:type')
	let auth = useAuth()

	function handleBack() {
		history.replace('/')
	}

	async function handleSubmit(user: UserForm) {
		if (!match) {
			return
		}

		setError(null)
		setLoading(true)

		let fn = match.params.type === 'signin'
			? auth.signIn
			: auth.signUp

		let ref = query.get('ref') ?? '/'

		try {
			await fn(user.email, user.password)
			setLoading(false)
			history.replace(ref)
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

let Footer = styled.footer`
	text-align: center;
`

let Divider = styled.hr`
	border: 0;
	height: 1px;
	width: 100%;
	margin-block-start: var(--baseline);
	margin-block-end: calc(var(--baseline) * 1.625);
	background: var(--border-color);
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