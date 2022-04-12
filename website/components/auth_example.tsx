import { Auth } from '@riezler/auth-sdk'
import { Route, MemoryRouter as Router } from 'react-router-dom'
import { AuthShell, useUser } from '@riezler/auth-ui'
import { Auth as AuthCtx, useAuth } from '@riezler/auth-react'
import '@biotic-ui/leptons/style/base.css'

let auth = Auth.create({
	project: 'ae16cc4a-33be-4b4e-a408-e67018fe453b',
	baseURL: 'http://127.0.0.1:8000'
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
