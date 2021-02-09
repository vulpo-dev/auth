import React from 'react'
import { FunctionComponent } from 'react'
import { Container } from 'component/layout'

import EmailSettings from 'settings/email'
import ProjectSettings from 'settings/project'

type Props = {
	project: string;
}

let Settings: FunctionComponent<Props> = ({ project }) => {
	return (
		<Container maxWidht={680}>
			<ProjectSettings />
			<EmailSettings project={project} />
		</Container>
	)
}

export default Settings
