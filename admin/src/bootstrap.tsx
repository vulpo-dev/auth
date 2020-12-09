import { useEffect, useMemo } from 'react'
import { BrowserRouter, useHistory } from 'react-router-dom'
import App from 'app'
import { useProject, projectIdAtom } from 'data/admin'
import { RecoilRoot, useSetRecoilState } from 'recoil'
import { Auth as AuthCtx } from '@riezler/auth-react'
import { Auth } from '@riezler/auth-sdk'
import { GhostPage } from 'component/loading'

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
			history.replace('/setup')
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
			<App />
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