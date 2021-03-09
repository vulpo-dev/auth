import React from 'react'
import { SyntheticEvent, useState } from 'react'
import styled from 'styled-components'
import { Card, CardHeader, CardNav } from 'component/card'
import { Input } from '@biotic-ui/input'
import { Label, Error, Title, Subtitle } from 'component/text'
import { useForm } from '@biotic-ui/std'
import { useTranslation, useError } from 'context/translation'
import { useConfig, useFlags } from 'context/config'
import { Button, IconButton } from '@biotic-ui/button'
import { ErrorCode, Flag } from '@riezler/auth-sdk'
import { useHistory, useRouteMatch, Switch, Route, Redirect } from 'react-router-dom'
import { useAuth } from '@riezler/auth-react'

import CheckEmail from 'password_reset/check'
import SetPassword from 'password_reset/set_password'

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
	let [form, setForm] = useForm<Form>({ email: '' })
	let t = useTranslation()
	let config = useConfig()
	let errorMessage = useError(error)

	let handleSubmit = (e: SyntheticEvent) => {
		e.preventDefault()
		onReset(form)
	}

	return (
		<Card>
			<CardNav>
				<IconButton id="back" aria-label={t.signin.label} onClick={() => onBack()}>
					{ config.Arrow }
				</IconButton>
				<label htmlFor="back">{t.signin.label}</label>
			</CardNav>
			<CardHeader>
				<Title>{t.reset_password.title}</Title>
				<Subtitle>{t.reset_password.info}</Subtitle>
			</CardHeader>
			<form onSubmit={handleSubmit}>
				<Section>
					<Label htmlFor="email">{t.label.email}</Label>
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
				</Section>

				<Section>
					<Button loading={loading}>{t.reset_password.button}</Button>
				</Section>

				{ error &&
					<Error>{errorMessage}</Error>
				}
			</form>
		</Card>
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
			error={null}
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


let Section = styled.section`
	margin-block-end: var(--baseline-2);
	display: flex;
	flex-direction: column;
`