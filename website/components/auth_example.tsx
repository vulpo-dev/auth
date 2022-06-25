import { Auth } from '@vulpo-dev/auth-sdk'
import { Route } from 'react-router-dom'
import { AuthShell, useUser } from '@vulpo-dev/auth-ui'
import { Auth as AuthCtx, useAuth } from '@vulpo-dev/auth-react'

let AuthClient = Auth.create({
	project: process.env.NEXT_PUBLIC_AUTH_PROJECT ?? '',
	baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? ''
})

let DummyPage = () => {
	let auth = useAuth()
	let user = useUser()

	return (
		<div className='demo-wrapper'>
			<button onClick={() => auth.signOut()}>
				Sign Out
			</button>
			<pre>
				{ JSON.stringify(user, null, 2) }
			</pre>		
		</div>
	)
}

export default function App() {
	return (
	  	<AuthCtx.Provider value={AuthClient}>
	    	<AuthShell basename='ui'>
				<Route path='/' element={<DummyPage />}/>
			</AuthShell>
	  	</AuthCtx.Provider>
	)
}
