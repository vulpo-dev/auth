import React from 'react'
import { SyntheticEvent, FC, useState, useEffect } from 'react'
import styled from 'styled-components'
import { Password } from '@biotic-ui/input'
import { Button } from '@biotic-ui/button'
import { useForm, useQueryParams } from '@biotic-ui/std'
import { ErrorCode } from '@riezler/auth-sdk'
import { useAuth } from '@riezler/auth-react'
import { Flow } from '@biotic-ui/leptons'
import { useLocation, useHistory, Link } from 'react-router-dom'

import { Card, CardHeader, CardTitle } from '../component/card'
import { Label, Error } from '../component/text'
import { checkPasswordLength, BASELINE } from '../utils'
import { useTranslation, useError } from '../context/translation'

type Form = {
	password1: string;
	password2: string;
}

export type Props = {
	loading: boolean;
	error: null | ErrorCode;
	onSubmit: (f: Form) => void;
	verifyToken: boolean;
}

export let SetPassword: FC<Props> = ({ 
	loading = false,
	error,
	onSubmit,
	verifyToken,
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
		onSubmit(form)
	}

	let tokenError = (
		error === ErrorCode.ResetInvalidToken ||
		error === ErrorCode.ResetTokenNotFound ||
		error === ErrorCode.ResetExpired
	)

	return (
		<Card className="vulpo-auth-password-reset-set-password">
			<Header>
				<Title>{t.set_password.title}</Title>
			</Header>
			
			{ tokenError &&
				<Section>
					<Error>{errorMessage}</Error>
					<Overview to='/'>Overview</Overview>
				</Section>
			}


			{ verifyToken &&
				<LoadingWrapper>
					<StyledFlow />
				</LoadingWrapper>
			}


			{ !verifyToken &&

				<form onSubmit={handleSubmit}>
					<Section>
						<Label htmlFor="password1">{t.set_password.new_password}</Label>
						<Password
							id="password1"
							name='password1'
							autoComplete='new-password'
							value={form.password1}
							onChange={setPassword1}
							disabled={loading || tokenError}
							required
							autoFocus
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
						<Button className="vulpo-auth-button" loading={loading} disabled={tokenError}>
							{t.set_password.button_label}
						</Button>
					</Section>

					{ (error && ! tokenError) &&
						<Error>{errorMessage}</Error>
					}

				</form>
			}
		</Card>
	)
}

let SetPasswordContainer = () => {
	let auth = useAuth()
	let history = useHistory()
	let location = useLocation()
	let query = useQueryParams(location.search)

	let [error, setError] = useState<ErrorCode | null>(null)
	let [loading, setLoading] = useState<boolean>(false)
	let [verifyToken, setVerifyToken] = useState<boolean>(true)

	useEffect(() => {
		let id = query.get('id')
		let token = query.get('token')

		if (!id || !token) {
			setError(ErrorCode.ResetTokenNotFound)
			return
		}

		let sink = Promise.all([
			wait(2000),
			auth.verifyToken(id, token)
		])
		
		sink.then(() => setVerifyToken(false))
			.catch(err => {
				setVerifyToken(false)
				setError(err.code)
			})

	}, [])

	async function handleSubmit(form: Form) {

		let id = query.get('id')
		let token = query.get('token')

		if (!id || !token) {
			setError(ErrorCode.ResetTokenNotFound)
			return
		}

		setLoading(true)
		setError(null)

		try {
			await auth.setResetPassword({ ...form, id, token })
			history.replace('/signin/email')
		} catch(err) {
			setLoading(false)
			setError(err.code)
		}
	}

	return (
		<SetPassword
			onSubmit={handleSubmit}
			loading={loading}
			error={error}
			verifyToken={verifyToken}
		/>
	)
}

export default SetPasswordContainer

let Title = styled(CardTitle)`
	line-height: 1;
	margin-block-start: calc(${BASELINE} * -0.375);
`

let Header = styled(CardHeader)`
	margin-block-end: calc(${BASELINE} * 2.75);
`

let Section = styled.section`
	margin-block-end: calc(${BASELINE} * 2);
	display: flex;
	flex-direction: column;
`

let LoadingWrapper = styled.div`
	display: flex;
	justify-content: center;
`

let StyledFlow = styled(Flow)`
	align-items: center;
`

let Overview = styled(Link)`
	margin-block-start: ${BASELINE};
	text-align: center;
	color: currentColor;
`

function wait(time: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, time)
	})
}
