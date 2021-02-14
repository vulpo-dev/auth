import React from 'react'
import { SyntheticEvent } from 'react'
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
		</Card>
	)
}


let EnterEmailContainer = () => {
	let history = useHistory()
	let match = useRouteMatch<{ type: 'signin' | 'signup' }>('/:type')

	let loading = false
	let error = null

	function handleBack() {
		if (match) {
			history.replace(`/${match.params.type}`)
		} else {
			history.replace('/')
		}
	}

	function handleSignIn(form: Form) {
		console.log({ form })
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
