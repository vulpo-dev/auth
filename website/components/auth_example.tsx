import { Auth } from '@riezler/auth-sdk'
import { Route, BrowserRouter as Router } from 'react-router-dom'
import { AuthShell, useUser } from '@riezler/auth-ui'
import { Auth as AuthCtx, useAuth } from '@riezler/auth-react'
import '@biotic-ui/leptons/style/base.css'

let auth = Auth.create({
	project: 'f8fb79dd-f52c-4ee1-b016-cf4094f24c34',
	baseURL: 'https://admin.vulpo.dev'
})

let App = () => (
	<AuthShell>
		<Route path='/'>
			<DummyPage />
		</Route>
	</AuthShell>
)

let DummyPage = () => {
	let auth = useAuth()
	let user = useUser()

	return (
		<div>
			<button onClick={() => auth.signOut()}>
				Sign Out
			</button>
			<pre>
				{ JSON.stringify(user, null, 2) }
			</pre>		
		</div>
	)
}

export default function AuthContainer() {
	return (
		<Router>
		  	<AuthCtx.Provider value={auth}>
		    	<App />
		  	</AuthCtx.Provider>
		</Router>
	)
}
