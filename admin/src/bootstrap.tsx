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
import { RecoilRoot, useSetRecoilState } from 'recoil'
import { Auth as AuthCtx } from '@riezler/auth-react'
import { Auth } from '@riezler/auth-sdk'
import { GhostPage } from 'component/loading'
import Setup from 'setup'

let Bootstrap = () => {
	let history = useHistory()
	let { project } = useProject()
	let setProjectId = useSetRecoilState(projectIdAtom)

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
			<Switch>
				<Route path='/setup'>
					<Setup />
				</Route>

				
				<Route path='/'>
					<App />
				</Route>
			</Switch>
		</AuthCtx.Provider>
	)
}

let BootstrapContainer = () => (
	<RecoilRoot>		
		<BrowserRouter basename='/admin'>
			<Bootstrap />
		</BrowserRouter>
	</RecoilRoot>
)

export default BootstrapContainer