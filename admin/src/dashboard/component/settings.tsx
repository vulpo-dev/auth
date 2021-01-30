import React from 'react'
import { FunctionComponent } from 'react'
import { useEmailSettings } from 'data/settings'


type Props = {
	project: string;
}

let Settings: FunctionComponent<Props> = ({ project }) => {
	let [{ data }] = useEmailSettings(project)

	return (
		<div>
			<h1>Settings</h1>
			<pre>{JSON.stringify(data, null, 2)}</pre>
		</div>
	)
}

export default Settings
