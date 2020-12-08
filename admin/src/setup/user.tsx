import { SyntheticEvent } from 'react'
import styled from 'styled-components'
import { useHistory } from 'react-router-dom'
import { Input } from '@biotic-ui/input'
import { useForm } from '@biotic-ui/std' 
import { Button } from '@biotic-ui/button'
import { useRecoilValue } from 'recoil'
import { projectIdAtom, createAdmin, CreateAdmin } from 'data/admin'

export type Props = {
	onSubmit: (user: CreateAdmin) => void;
}

export let User = ({ onSubmit }: Props) => {
	
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

				<StyledButton>Create Admin</StyledButton>
			</Form>
		</div>
	)
}

let UserContainer = () => {
	let history = useHistory()
	let project = useRecoilValue(projectIdAtom)

	async function handleSubmit(user: CreateAdmin) {
		// handle error
		if (project === null) {
			return
		}

		try {
			await createAdmin(user, project)
			history.replace('/auth/#/signin')
		} catch (err) {
			console.log(err)
		}
	}

	return <User onSubmit={handleSubmit} />
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