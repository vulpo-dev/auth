import { useEffect } from 'react'
import { BrowserRouter, useHistory } from 'react-router-dom'
import App from 'app'
import { useProject, projectIdAtom } from 'data/admin'
import { RecoilRoot, useSetRecoilState } from 'recoil'

let Bootstrap = () => {
	let history = useHistory()
	let { project } = useProject()
	let setProjectId = useSetRecoilState(projectIdAtom)

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
		return <p>...loading</p>
	}

	return <App />
}

let BootstrapContainer = () => (
	<RecoilRoot>		
		<BrowserRouter basename='/admin'>
			<Bootstrap />
		</BrowserRouter>
	</RecoilRoot>
)

export default BootstrapContainer