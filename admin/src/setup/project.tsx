import React, { useEffect } from 'react'
import styled from 'styled-components'
import { useCreateProject, CreateAdminProject, projectId } from 'data/admin'
import { useHistory } from 'react-router-dom'
import { Flow } from '@biotic-ui/leptons'
import { ErrorMessage } from '@biotic-ui/text'
import { Input } from '@biotic-ui/input'
import { useForm } from '@biotic-ui/std'
import { Button } from '@biotic-ui/button' 
import { useProject } from 'data/admin'
import { QueryState, useBosonValue } from '@biotic-ui/boson'

export type Props = {
	error: boolean;
	loading: boolean;
	onSubmit: (form: CreateAdminProject) => void;
}

export let Project = ({ error, loading, onSubmit }: Props) => {

	let [form, setForm] = useForm<CreateAdminProject>({
		host: getDefaultHost()
	})

	function handleSubmit() {
		onSubmit(form)
	}

	return (
		<Wrapper>
			<h2>Create Admin Project</h2>
			<ContentWrapper>
				{ (!error && loading) &&
					<React.Fragment>
						<Flow />
					</React.Fragment>
				}

				{ !loading &&
					<Form onSubmit={handleSubmit}>
						<p>Add the host where the admin dashboard will run.</p>
						<Section>
							<label>Host</label>
							<Input
								name='host'
								type='text'
								value={form.host}
								onChange={setForm}
								required
							/>
						</Section>
						
						{ error !== null &&
							<ErrorMessage>Something went wrong</ErrorMessage>
						}

						<StyledButton loading={loading}>
							Create Admin
						</StyledButton>
					</Form>
				}

			</ContentWrapper>

		</Wrapper>
	)
}

let ProjectContainer = () => {
	let history = useHistory()
	let createProject = useCreateProject()
	let project = useBosonValue(projectId)

	useEffect(() => {
		if (project) {
			history.replace('/setup/user')
		}
	}, [project])

	let handleSubmit = async (form: CreateAdminProject) => {
		await createProject(form)
		history.replace('/setup/user')
	}

	return <Project
		onSubmit={handleSubmit}
		error={createProject.error}
		loading={createProject.loading }
	/>
}

export default ProjectContainer

let Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
`

let ContentWrapper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	flex-grow: 1;
`

let Form = styled.form`
	display: flex;
	flex-direction: column;
	width: 100%;
`

let Section = styled.section`
	margin-bottom: var(--baseline-2);
`

let StyledButton = styled(Button)`
	margin-left: auto;
`

function getDefaultHost() {
	return `${window.location.protocol}//${window.location.host}`
}