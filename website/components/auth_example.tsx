import { Auth } from '@vulpo-dev/auth-sdk'
import { Route } from 'react-router-dom'
import { AuthShell, useUser } from '@vulpo-dev/auth-ui'
import { Auth as AuthCtx, useAuth } from '@vulpo-dev/auth-react'

let auth = Auth.create({
	project: process.env.NEXT_PUBLIC_AUTH_PROJECT ?? '',
	baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? ''
})

let App = () => (
	<AuthShell>
		<Route path='/' element={<DummyPage />}/>
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
	  	<AuthCtx.Provider value={auth}>
	    	<App />
	  	</AuthCtx.Provider>
	)
}
