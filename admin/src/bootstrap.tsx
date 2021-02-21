import React from 'react'
import { useEffect, useMemo } from 'react'
import {
	BrowserRouter,
	useHistory,
	Switch,
	Route
} from 'react-router-dom'
import App from 'app'
import { useProject, projectIdAtom } from 'data/admin'
import { Http } from 'data/http'
import { useSetBoson } from '@biotic-ui/boson'
import { Auth as AuthCtx } from '@riezler/auth-react'
import { Auth } from '@riezler/auth-sdk'
import { GhostPage } from 'component/loading'
import Setup from 'setup'

let Bootstrap = () => {
	let history = useHistory()
	let { project } = useProject()
	let setProjectId = useSetBoson(projectIdAtom)

	let auth = useMemo(() => {
		if (!project) {
			return null
		}

		return Auth.create({
			baseURL: '/',
			project: project
		})
	}, [project])

	useEffect(() => {
		let isSetup = window.location.pathname.startsWith('/setup')
		if (project === null && !isSetup) {
			history.replace('/setup/')
		}

		if (project) {
			setProjectId(project)
		}
	}, [project, history, setProjectId])

	if (project === undefined) {
		return <GhostPage />
	}

	return (
		<AuthCtx.Provider value={auth}>
			<Http auth={auth} project={project}>
				<Switch>
					<Route path='/setup'>
						<Setup />
					</Route>

					
					<Route path='/'>
						<App />
					</Route>
				</Switch>
			</Http>
		</AuthCtx.Provider>
	)
}

let BootstrapContainer = () => (	
	<BrowserRouter basename='/admin'>
		<Bootstrap />
	</BrowserRouter>
)

export default BootstrapContainer