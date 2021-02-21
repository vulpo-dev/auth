import React from 'react'
import { SyntheticEvent, useState } from 'react'
import styled from 'styled-components'
import { useHistory } from 'react-router-dom'
import { Input } from '@biotic-ui/input'
import { useForm } from '@biotic-ui/std' 
import { Button } from '@biotic-ui/button'
import { useBosonValue } from '@biotic-ui/boson'
import { projectIdAtom, createAdmin, CreateAdmin } from 'data/admin'

export type Props = {
	onSubmit: (user: CreateAdmin) => void;
	loading?: boolean;
}

export let User = ({ onSubmit, loading = false }: Props) => {
	
	let [form, setForm] = useForm<CreateAdmin>({
		email: '',
		password: '',
	})

	function handleSubmit(e: SyntheticEvent) {
		e.preventDefault()
		onSubmit(form)
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

				<StyledButton loading={loading}>
					Create Admin
				</StyledButton>
			</Form>
		</div>
	)
}

let UserContainer = () => {
	let history = useHistory()
	let project = useBosonValue(projectIdAtom)
	let [loading, setLoading] = useState(false)

	async function handleSubmit(user: CreateAdmin) {
		// handle error
		if (project === null) {
			return
		}

		try {
			setLoading(true)
			await createAdmin(user, project)
			history.replace('/auth/#/signin')
		} catch (err) {
			console.log(err)
		}
	}

	return <User loading={loading} onSubmit={handleSubmit} />
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