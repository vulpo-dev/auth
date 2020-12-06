import { SyntheticEvent } from 'react'
import styled from 'styled-components'
import { Card } from 'component/card'
import { Input } from '@biotic-ui/input'
import { useForm } from '@biotic-ui/std'
import { Button, IconButton } from '@biotic-ui/button'
import { useTranslation } from 'context/translation'
import { useConfig } from 'context/config'
import { useHistory, useRouteMatch } from 'react-router-dom'
import { Label } from 'component/text'
import { Disclaimer } from 'component/disclaimer'

type UserForm = {
	email: string,
	password: string,
}

export type Props = {
	onBack: () => void;
	onSubmit: (user: UserForm) => void;
	ctx: 'signin' | 'signup'
}

export let Password = ({ onSubmit, onBack, ctx }: Props) => {
	let config = useConfig()

	let [form, setForm] = useForm<UserForm>({
		email: '',
		password: ''
	})

	let t = useTranslation()

	function handleSubmit(e: SyntheticEvent) {
		e.preventDefault()
		onSubmit(form)
	}

	let button = ctx === 'signin'
		? t.signin.label
		: t.signup.label

	return (
		<Card>
			<Header>
				<Nav>
					<IconButton onClick={() => onBack()}>
						{ config.Arrow }
					</IconButton>
					<span>{button}</span>
				</Nav>
				<h3>{t.password.title}</h3>
			</Header>

			<form onSubmit={handleSubmit}>
				<Section>
					<Label>{t.label.email}</Label>
					<Input
						name='email'
						value={form.email}
						onChange={setForm}
						required
					/>
				</Section>

				<PasswordSection>
					<Label>{t.label.password}</Label>
					<Input
						name='password'
						type='password'
						value={form.password}
						onChange={setForm}
						required
					/>
				</PasswordSection>

				<Section>
					<Button>{button}</Button>
				</Section>
			</form>

			<Divider />

			<Footer>
				<Disclaimer  />
			</Footer>
		</Card>
	)
}

let PasswordContainer = () => {
	let history = useHistory()

	let match = useRouteMatch<{ type: 'signin' | 'signup' }>('/:type')

	function handleBack() {
		history.replace('/')
	}

	function handleSubmit(user: UserForm) {
		console.log(user)
	}

	return (
		<Password
			onBack={handleBack}
			onSubmit={handleSubmit}
			ctx={match?.params?.type ?? 'signin'}
		/>
	)
}

let Header = styled.header`
	margin-bottom: var(--baseline-2);

	h3 {
		margin-bottom: 0;
	}

	${IconButton} {
		margin-right: var(--baseline);
	}
`

let Nav = styled.div`
	display: flex;
	align-items: center;
	margin-bottom: var(--baseline);
`

let StyledButton = styled(Button)`
	margin-left: auto;
`

let Section = styled.section`
	margin-bottom: var(--baseline-2);
	display: flex;
	flex-direction: column;
`

let PasswordSection = styled.section`
	margin-bottom: var(--baseline-3);
`

let Footer = styled.footer`
	text-align: center;
`

let Divider = styled.hr`
	border: 0;
	height: 1px;
	width: 100%;
	margin-top: var(--baseline);
	margin-bottom: var(--baseline-2);
	background: var(--border-color);
`