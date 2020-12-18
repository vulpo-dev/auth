import React from 'react'
import { SyntheticEvent } from 'react'
import styled from 'styled-components'
import { Card, CardHeader, CardNav, CardTitle } from 'component/card'
import { Input } from '@biotic-ui/input'
import { Label, Error } from 'component/text'
import { useForm } from '@biotic-ui/std'
import { useTranslation, useError } from 'context/translation'
import { useConfig } from 'context/config'
import { Button, IconButton } from '@biotic-ui/button'
import { ErrorCode } from '@riezler/auth-sdk'

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
				<IconButton onClick={() => onBack()}>
					{ config.Arrow }
				</IconButton>
				<span>{t.signin.label}</span>
			</CardNav>
			<CardHeader>
				<Title>{t.reset_password.title}</Title>
				<Subtitle>{t.reset_password.info}</Subtitle>
			</CardHeader>
			<form onSubmit={handleSubmit}>
				<Section>
					<Label>{t.label.email}</Label>
					<Input
						disabled={loading}
						name='email'
						type='email'
						value={form.email}
						onChange={setForm}
						required
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


let Section = styled.section`
	margin-bottom: var(--baseline-2);
	display: flex;
	flex-direction: column;
`

let Title = styled(CardTitle)`
	margin-bottom: calc(var(--baseline) * 0.625);
`

let Subtitle = styled.p`
	margin-bottom: 0;
`