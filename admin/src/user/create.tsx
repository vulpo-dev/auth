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
import { NewUser } from 'data/user/types'
import { useCreateUser, useUsers } from 'data/user'

export type Props = {
	form: NewUser;
	onChange: (e: ChangeEvent) => void;
	onSubmit: (data: NewUser) => void;
	error?: ApiError | null;
	loading?: boolean;
	passwordless: boolean;
}

function validatePassword(elm: HTMLInputElement) {
	checkPasswordLength(elm, {
		password_min_length: 'The password should be at least 8 characters long',
		password_max_length: 'The password cannot be longer than 64 characters',
	})
}

export let CreateUser = ({ form, onChange, onSubmit, error, passwordless, loading }: Props) => {

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
						<Option disabled={!passwordless} value='link'>Passwordless</Option>
					</Select>
				</Section>

				{ form.type === 'password' &&
					<Section>
						<Label>Temporary Password</Label>
						<Input
							ref={elm => elm && validatePassword(elm)}
							name='password'
							type='text'
							value={form.password ?? ''}
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
					<Button loading={loading}>
						Create User
					</Button>
				</Section>
			</form>
		</Wrapper>
	)
}


type ContainerProps = {
	onCreated: () => void;
}

let DefaultForm: NewUser = {
	email: '',
	type: 'password',
	password: '',
}

let CreateUserContainer = ({ onCreated }: ContainerProps) => {
	let [project] = useProject()
	let [{ data: emailSettings }] = useEmailSettings(project.id)
	let hasEmail = hasEmailProvider(emailSettings)
	let createUser = useCreateUser(project.id)
	let [_, actions] = useUsers({
		project: project.id,
		limit: 25,
	})

	let [form, setForm, reset] = useForm<NewUser>(DefaultForm)

	async function handleSubmit(user: NewUser) {
		try {
			await createUser(user, form.type)
			actions.reload()
			onCreated()
			reset(DefaultForm)
		} catch(err) {

		}
	}


	return <CreateUser
		form={form}
		onChange={setForm}
		onSubmit={handleSubmit}
		passwordless={hasEmail}
		error={createUser.error}
		loading={createUser.loading}
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