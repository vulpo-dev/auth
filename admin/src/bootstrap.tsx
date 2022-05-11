import React from 'react'
import { useEffect, useMemo } from 'react'
import {
	BrowserRouter,
	useNavigate,
	Routes,
	Route,
} from 'react-router-dom'
import App from 'app'
import { useProject } from 'data/admin'
import { Http } from 'data/http'
import { Auth as AuthCtx } from '@riezler/auth-react'
import { Auth } from '@riezler/auth-sdk'
import { GhostPage } from 'component/loading'
import Setup from 'setup'


let Bootstrap = () => {
	let navigate = useNavigate()
	let [{ data: project, state }, { set: setProjectId }] = useProject()

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
		if (project === null && !isSetup && state === 'loaded') {
			navigate('/setup/', { replace: true })
		}
	}, [project, state, navigate, setProjectId])

	if (state === 'loading') {
		return <GhostPage />
	}

	return (
		<AuthCtx.Provider value={auth}>
			<Http auth={auth} project={project}>
				<Routes>
					<Route path='/setup' element={<Setup />} />

					{ auth &&
						<Route path='/*' element={<App />} />
					}
				</Routes>
			</Http>
		</AuthCtx.Provider>
	)
}

let BootstrapContainer = () => (	
	<BrowserRouter basename='/dashboard'>
		<Bootstrap />
	</BrowserRouter>
)

export default BootstrapContainer