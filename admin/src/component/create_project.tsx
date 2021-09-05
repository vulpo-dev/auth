import React from 'react'
import { SyntheticEvent, FunctionComponent } from 'react'
import styled from 'styled-components'
import { useForm, useMounted } from '@biotic-ui/std'
import { Input, Label, Section } from '@biotic-ui/input'
import { Button } from 'component/button'
import { useCreateProject, PartialProject } from 'data/project'
import { ApiError } from 'error'

type Form = {
	name: string;
	domain: string;
}

let DefaultForm = {
	name: '',
	domain: '',
}

type Props = {
	onSuccess: (p: PartialProject) => void;
}

let CreateProject: FunctionComponent<Props> = ({ onSuccess, ...props }) => {
	let isMounted = useMounted()
	let [form, setForm, set] = useForm<Form>(DefaultForm)
	let createProject = useCreateProject()

	async function handleSubmit(e: SyntheticEvent) {
		e.preventDefault()

		try {
			let project = await createProject(form.name, form.domain)
			if (isMounted && project) {
				set(DefaultForm)
				onSuccess(project)
			}
		} catch (err) {}
	}

	return (
		<Wrapper {...props}>
			<h2>Create New Project</h2>
			<form onSubmit={handleSubmit}>
				<Section>
					<Label>Project Name:</Label>
					<Input
						name='name'
						onChange={setForm}
						value={form.name}
						required
					/>
				</Section>
				<Section>
					<Label>Project Domain:</Label>
					<Input
						name='domain'
						onChange={setForm}
						value={form.domain}
						placeholder='https://'
						required
					/>
				</Section>
				<Section>
					<Button loading={createProject.loading}>
						Create Project
					</Button>
				</Section>

				{ createProject.error &&
					<Section>
						<p>{getErrorMessage(createProject.error)}</p>
					</Section>
				}
			</form>
		</Wrapper>
	)
}

export default CreateProject

let Wrapper = styled.div`
	padding: var(--baseline-3);
	padding-left: var(--baseline-4);
	--input-border: 1px solid rgba(34,36,38,.15);
	--input-color: rgba(0,0,0,.87);
	--input-bg: none;
`

function getErrorMessage(code: ApiError): string {
	switch (code) {
		case ApiError.ProjectNameExists:
			return 'Project name already exists'

		default:
			return 'Something went wrong'
	}
}