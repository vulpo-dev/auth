import { useEffect } from 'react'
import { useCreateProject } from 'data/admin'
import { useHistory } from 'react-router-dom'

export let Project = () => {
	return (
		<div>
			<h2>Creating Admin Project</h2>
			<p>Creating Admin Project</p>
		</div>
	)
}

let ProjectContainer = () => {
	let history = useHistory()
	let { id } = useCreateProject()

	useEffect(() => {
		if (id) {
			history.replace('/setup/user')
		}
	}, [id, history])

	return <Project />
}

export default ProjectContainer