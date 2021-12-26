import React from 'react'
import { Header, Section } from 'settings/component/layout'
import { useProject, usePublicKeys } from 'data/project'
import { useSetProjectSettings } from 'data/settings'

import { Textarea, Section as InputSection, Label } from '@biotic-ui/input'

let ProjectSettings = () => {
	let [project] = useProject()
	let [{ data: keys = [] }] = usePublicKeys(project.id)

	return (
		<Section>
			<form>
				<Header>
					<h2>Public Keys</h2>
				</Header>
				{ keys.map(key => 
					<InputSection key={key.id}>
						<Label>Key ID: { key.id }</Label>
						<Textarea
							minRows={9}
							value={key.key}
							readOnly />
					</InputSection>
				)}
			</form>
		</Section>
	)
}

export default ProjectSettings