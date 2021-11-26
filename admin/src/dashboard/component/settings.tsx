import React from 'react'
import { FunctionComponent } from 'react'
import { Container } from 'component/layout'

import EmailSettings from 'settings/email'
import ProjectSettings from 'settings/project'
import DeleteProject from 'settings/delete'
import { useProject } from 'data/project'


let Settings: FunctionComponent = () => {
	let [project] = useProject()

	return (
		<Container maxWidht={680}>
			<ProjectSettings />
			<EmailSettings project={project.id} />

			{ !project.is_admin &&
				<DeleteProject />
			}
		</Container>
	)
}

export default Settings
