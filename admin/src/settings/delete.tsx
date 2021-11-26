import React, { FormEvent, FunctionComponent } from 'react'
import { Header, Section } from 'settings/component/layout'
import { Input, Section as ISection, Label } from '@biotic-ui/input'
import { WarnButton } from 'component/button'
import { useProject, useDeleteProject, projectsAtom } from 'data/project'
import { useForm } from '@biotic-ui/std'
import { useHistory } from 'react-router-dom'
import { useSetBoson } from '@biotic-ui/boson'

let DeleteProject: FunctionComponent<{}> = () => {
	let [project] = useProject()
	let deleteProject = useDeleteProject(project.id)
	let [form, setForm] = useForm({ name: '' })
	let history = useHistory()
	let setProjects = useSetBoson(projectsAtom)

	async function submit(e: FormEvent) {
		e.preventDefault()

		await deleteProject()
		history.replace('/')

		setProjects((projects = []) => {
			return projects.filter(p => p.id !== project.id)
		})
	}

	return (
		<form onSubmit={submit}>
			<Section>
				<Header>
					<h2>Delete Project</h2>

					<WarnButton
						loading={deleteProject.loading}
						disabled={form.name !== project.name}
					>
						Delete
					</WarnButton>
				</Header>

				<ISection>
					<p>Enter the project name before you can delete the project.</p>
				</ISection>

				<ISection>
					<Label>Project Name:</Label>
					<Input
						name='name'
						onChange={setForm}
						value={form.name}
						disabled={deleteProject.loading}
					/>
				</ISection>
			</Section>
		</form>
	)
}

export default DeleteProject