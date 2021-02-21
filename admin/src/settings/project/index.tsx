import React from 'react'
import { Header, Section } from 'settings/component/layout'
import { useProject } from 'data/project'
import { Input, Label, Section as InputSection } from '@biotic-ui/input'
import { Button } from '@biotic-ui/button'

let ProjectSettings = () => {
	let project = useProject()

	return (
		<Section>
			<Header>
				<h2>Project</h2>

				<Button>
					Save
				</Button>
			</Header>
			<InputSection>
				<Label>Project ID:</Label>
				<Input value={project.id} readOnly />
			</InputSection>

			<InputSection>
				<Label>Name:</Label>
				<Input value={project.name} />
			</InputSection>

			<InputSection>
				<Label>Domain:</Label>
				<Input value={project.domain} />
			</InputSection>
		</Section>
	)
}

export default ProjectSettings