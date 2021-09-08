import React, { ChangeEvent, FormEvent } from 'react'
import { useForm } from '@biotic-ui/std'
import { Input, Label, Section } from '@biotic-ui/input'
import { Select, Option } from '@biotic-ui/select'
import { Wrapper } from 'component/drawer'
import { Button } from 'component/button'
import { ApiError } from 'error'
import { ErrorMessage } from '@biotic-ui/text'
import { checkPasswordLength } from '@riezler/auth-ui'
import { hasEmailProvider, useEmailSettings } from 'data/settings'
import { useProject } from 'data/project'

export type FormData = {
	email: string;
	type: 'passwordless' | 'password';
	password: string;
}

export type Props = {
	form: FormData;
	onChange: (e: ChangeEvent) => void;
	onSubmit: (data: FormData) => void;
	error?: ApiError | null;
	passwordless: boolean;
}

function validatePassword(elm: HTMLInputElement) {
	checkPasswordLength(elm, {
		password_min_length: 'The password should be at least 8 characters long',
		password_max_length: 'The password cannot be longer than 64 characters',
	})
}

export let CreateUser = ({ form, onChange, onSubmit, error, passwordless }: Props) => {

	function handleSubmit(e: FormEvent) {
		e.preventDefault()
		onSubmit(form)
	}

	function setPassword(e: ChangeEvent<HTMLInputElement>) {
		validatePassword(e.target)
		onChange(e)
	}

	return (
		<Wrapper>
			<h2>Create User</h2>
			<form onSubmit={handleSubmit}>
				<Section>
					<Label>
						Email:
					</Label>
					<Input
						name='email'
						type='email'
						value={form.email}
						onChange={onChange}
						required
					/>
				</Section>

				<Section>
					<Label>Authentication Method</Label>
					<Select name='type' value={form.type} onChange={onChange}>
						<Option value='password'>Password</Option>
						<Option disabled={!passwordless} value='passwordless'>Passwordless</Option>
					</Select>
				</Section>

				{ form.type === 'password' &&
					<Section>
						<Label>Temporary Password</Label>
						<Input
							ref={elm => elm && validatePassword(elm)}
							name='password'
							type='text'
							value={form.password}
							onChange={setPassword}
							required
						/>
					</Section>
				}

				{ error &&
					<Section>
						<ErrorMessage>{getErrorMessage(error)}</ErrorMessage>
					</Section>
				}

				<Section>
					<Button>Create User</Button>
				</Section>
			</form>
		</Wrapper>
	)
}

let CreateUserContainer = () => {
	let [project] = useProject()
	let [{ data: emailSettings }] = useEmailSettings(project.id)
	let hasEmail = hasEmailProvider(emailSettings)

	let [form, setForm] = useForm<FormData>({
		email: '',
		type: 'password',
		password: '',
	})

	return <CreateUser
		form={form}
		onChange={setForm}
		onSubmit={() => {}}
		passwordless={hasEmail}
	/>
}

export default CreateUserContainer


function getErrorMessage(code: ApiError): string {
	switch (code) {
		case ApiError.UserExists:
			return 'User already exists'

		default:
			return 'Something went wrong'
	}
}