import React from 'react'
import { SyntheticEvent, useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Input } from '@biotic-ui/input'
import { useForm } from '@biotic-ui/std' 
import { Button } from '@biotic-ui/button'
import { useBosonValue } from '@biotic-ui/boson'
import { ErrorMessage } from '@biotic-ui/text'
import { projectId, createAdmin, CreateAdmin } from 'data/admin'
import { ApiError, getErrorCode } from 'error'
import { ApiError as SdkError } from '@vulpo-dev/auth-sdk'

export type Props = {
	onSubmit: (user: CreateAdmin) => void;
	loading?: boolean;
	error?: ApiError | null;
}

export let User = ({ onSubmit, loading = false, error }: Props) => {
	
	let [form, setForm] = useForm<CreateAdmin>({
		email: '',
		password: '',
	})

	function handleSubmit(e: SyntheticEvent) {
		e.preventDefault()
		onSubmit(form)
	}

	let errorMessage = () => {
		switch(error) {
			case ApiError.AdminHasAdmin:
				return "An admin user already exists"

			case ApiError.UserExists:
				return "User already exists"

			case ApiError.ProjectNotFound:
				return "Project not found"

			default:
				return "Something went wrong"
		}
	}

	return (
		<div>
			<h2>Create Admin User</h2>
			<Form onSubmit={handleSubmit}>
				<Section>
					<label>Email</label>
					<Input
						name='email'
						value={form.email}
						onChange={setForm}
						required
					/>
				</Section>
				<Section>
					<label>Password</label>
					<Input
						name='password'
						type='password'
						value={form.password}
						onChange={setForm}
						required
					/>
				</Section>
				
				{ error !== null &&
					<ErrorMessage>{errorMessage()}</ErrorMessage>
				}

				<StyledButton loading={loading}>
					Create Admin
				</StyledButton>
			</Form>
		</div>
	)
}

let UserContainer = () => {
	let navigate = useNavigate()
	let project = useBosonValue(projectId)
	let [loading, setLoading] = useState(false)
	let [error, setError] = useState<null | ApiError>(null)

	async function handleSubmit(user: CreateAdmin) {
		// handle error
		if (project === null) {
			return
		}

		try {
			setLoading(true)
			await createAdmin(user, project)
			navigate('/auth/#/signin', { replace: true })
		} catch (err) {
			setLoading(false)
			setError(getErrorCode(err as SdkError))
		}
	}

	return <User error={error} loading={loading} onSubmit={handleSubmit} />
}

export default UserContainer

let StyledButton = styled(Button)`
	margin-left: auto;
`

let Form = styled.form`
	display: flex;
	flex-direction: column;
`

let Section = styled.section`
	margin-bottom: var(--baseline-2);
`