import React from 'react'
import { ChangeEvent, FormEvent } from 'react'
import { Header, Section } from 'settings/component/layout'
import { useProject } from 'data/project'
import { useSetProjectSettings } from 'data/settings'

import { Input, Label, Section as InputSection } from '@biotic-ui/input'
import { Button } from '@biotic-ui/button'

let ProjectSettings = () => {
	let [project, setProject] = useProject()
	let save = useSetProjectSettings()

	function handleChange(e: ChangeEvent<HTMLInputElement>) {
		setProject({
			...project,
			[e.target.name]: e.target.value
		})
	}

	function handleSubmit(e: FormEvent) {
		e.preventDefault()
		save(project)
	}

	return (
		<Section>
			<form onSubmit={handleSubmit}>
				<Header>
					<h2>Project</h2>

					<Button loading={save.loading}>
						Save
					</Button>
				</Header>
				<InputSection>
					<Label>Project ID:</Label>
					<Input value={project.id} readOnly />
				</InputSection>

				<InputSection>
					<Label>Name:</Label>
					<Input
						name='name'
						value={project.name}
						onChange={handleChange}
					/>
				</InputSection>

				<InputSection>
					<Label>Domain:</Label>
					<Input
						name='domain'
						type='url'
						value={project.domain}
						onChange={handleChange}
					/>
				</InputSection>
			</form>
		</Section>
	)
}

export default ProjectSettings