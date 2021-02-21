import React from 'react'
import { SyntheticEvent, useState } from 'react'
import { Card, CardHeader, CardNav } from 'component/card'
import { Button, IconButton } from '@biotic-ui/button'
import { useConfig } from 'context/config'
import { useTranslation, useError } from 'context/translation'
import { Label, Error, Title, Subtitle } from 'component/text'
import { Section } from 'component/layout'
import { Input } from '@biotic-ui/input'
import { useForm } from '@biotic-ui/std'
import { ErrorCode } from '@riezler/auth-sdk'
import { useHistory, useRouteMatch } from 'react-router-dom'
import { useAuth } from '@riezler/auth-react'
import { Disclaimer } from 'component/disclaimer'
import { Footer, Divider } from 'component/layout'

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

	let [form, setForm] = useForm<Form>({
		email: ''
	})

	function handleSubmit(e: SyntheticEvent) {
		e.preventDefault()
		console.log({ form })
		props.onSignIn(form)
	}

	let label = props.ctx === 'signin'
		? t.signin.label
		: t.signup.label

	return (
		<Card>
			<CardNav>
				<IconButton id='back' onClick={props.onBack}>
					{ config.Arrow }				
				</IconButton>
				<label htmlFor="back">{label}</label>
			</CardNav>
			<CardHeader>
				<Title>{t.passwordless.title}</Title>
				<Subtitle>
					<t.passwordless.info label={label} />
				</Subtitle>
			</CardHeader>
			<form onSubmit={handleSubmit}>
				<Section>
					<Label htmlFor="email">{t.label.email}</Label>
					<Input
						id="email"
						name='email'
						type='email'
						disabled={props.loading}
						value={form.email}
						onChange={setForm}
						required
					/>
				</Section>

				<Section>
					<Button loading={props.loading}>{t.passwordless.button}</Button>
				</Section>

				{ props.error &&
					<Error>{errorMessage}</Error>
				}
			</form>

			<Divider />

			<Footer>
				<Disclaimer  />
			</Footer>
		</Card>
	)
}


let EnterEmailContainer = () => {
	let auth = useAuth()
	let history = useHistory()
	let match = useRouteMatch<{ type: 'signin' | 'signup' }>('/:type')

	let [error, setError] = useState<ErrorCode | null>(null)
	let [loading, setLoading] = useState<boolean>(false)

	function handleBack() {
		if (match) {
			history.replace(`/${match.params.type}`)
		} else {
			history.replace('/')
		}
	}

	async function handleSignIn(form: Form) {
		setLoading(true)
		setError(null)

		try {
			let id = await auth.passwordless(form.email)
			history.push(`/signin/link/check-email?id=${id}`)
		} catch (err) {
			setLoading(false)
			setError(err.code)
		}
	}

	return (
		<EnterEmail
			loading={loading}
			error={null}
			onBack={handleBack}
			onSignIn={handleSignIn}
			ctx={match?.params.type ?? 'signin'}
		/>
	)
}

export default EnterEmailContainer
