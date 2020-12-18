import React from 'react'
import { SyntheticEvent, useRef, FC } from 'react'
import styled from 'styled-components'
import { Card, CardHeader, CardNav, CardTitle } from 'component/card'
import { Password } from '@biotic-ui/input'
import { Label, Error } from 'component/text'
import { Button } from '@biotic-ui/button'
import { useForm } from '@biotic-ui/std'
import { checkPasswordLength } from 'utils'
import { useTranslation, useError } from 'context/translation'
import { ErrorCode } from '@riezler/auth-sdk'

type Form = {
	password1: string;
	password2: string;
}

export type Props = {
	loading: boolean;
	error: null | ErrorCode;
	onSubmit: (f: Form) => void;
}

export let SetPassword: FC<Props> = ({ 
	loading = false,
	error,
	onSubmit
}) => {
	let [form, setForm] = useForm<Form>({
		password1: '',
		password2: '',
	})

	let t = useTranslation()
	let errorMessage = useError(error)

	function setPassword1(e: SyntheticEvent) {
		let target = (e.target as HTMLInputElement)
		checkPasswordLength(target, t.error)
		setForm(e)
	}

	function setPassword2(e: SyntheticEvent<HTMLInputElement>) {
		let target = (e.target as HTMLInputElement)

		if (form.password1 !== target.value) {
			target.setCustomValidity(t.error.password_mismatch)
		} else {
			target.setCustomValidity('')
		}

		setForm(e)
	}

	function handleSubmit(e: SyntheticEvent) {
		e.preventDefault()
	}

	let tokenError = (
		error === ErrorCode.ResetInvalidToken ||
		error === ErrorCode.ResetTokenNotFound ||
		error === ErrorCode.ResetExpired
	)

	return (
		<Card>
			<Header>
				<Title>{t.set_password.title}</Title>
			</Header>
			
			{ tokenError &&
				<Section>
					<Error>{errorMessage}</Error>
				</Section>
			}

			<form onSubmit={handleSubmit}>
				<Section>
					<Label htmlFor="password1">{t.set_password.new_password}</Label>
					<Password
						id="password1"
						name='password1'
						value={form.password1}
						onChange={setPassword1}
						disabled={loading || tokenError}
						required
					/>
				</Section>
				<Section>
					<Label htmlFor="password2">{t.set_password.repeat_password}</Label>
					<Password
						id="password2"
						name='password2'
						value={form.password2}
						onChange={setPassword2}
						disabled={loading || tokenError}
						required
					/>
				</Section>
				<Section>
					<Button loading={loading} disabled={tokenError}>
						{t.set_password.button_label}
					</Button>
				</Section>

				{ (error && ! tokenError) &&
					<Error>{errorMessage}</Error>
				}

			</form>
		</Card>
	)
}


let Title = styled(CardTitle)`
	line-height: 1;
	margin-top: calc(var(--baseline) * -0.375);
`

let Header = styled(CardHeader)`
	margin-bottom: calc(var(--baseline) * 2.75);
`

let Section = styled.section`
	margin-bottom: var(--baseline-2);
	display: flex;
	flex-direction: column;
`
