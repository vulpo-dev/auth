import React from 'react'
import { SyntheticEvent, useState, FC } from 'react'
import styled from 'styled-components'
import { useForm, useMounted } from '@biotic-ui/std'
import { Input, Label, Section } from '@biotic-ui/input'
import { Button } from 'component/button'
import { useCreateProject, PartialProject } from 'data/project'
import { ApiError, getErrorCode } from 'error'

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

let CreateProject: FC<Props> = ({ onSuccess }) => {
	let isMounted = useMounted()
	let [error, setError] = useState<ApiError | null>(null)
	let [loading, setLoading] = useState<boolean>(false)

	let [form, setForm, set] = useForm<Form>(DefaultForm)

	let createProject = useCreateProject()

	async function handleSubmit(e: SyntheticEvent) {
		e.preventDefault()
		setLoading(true)

		try {
			let project = await createProject(form.name, form.domain)
			if (isMounted) {
				setLoading(false)
				set(DefaultForm)
				onSuccess(project)
			}
		} catch (err) {
			if (isMounted) {
				setLoading(false)
				setError(getErrorCode(err))
			}
		}
	}

	return (
		<Wrapper>
			<h1>Create New Project</h1>
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
					<Button loading={loading}>
						Create Project
					</Button>
				</Section>

				{ error &&
					<Section>
						<p>{getErrorMessage(error)}</p>
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