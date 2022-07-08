import { Auth } from '@vulpo-dev/auth-sdk'
import { Route } from 'react-router-dom'
import { AuthShell, useUser } from '@vulpo-dev/auth-ui'
import { Auth as AuthCtx, useAuth } from '@vulpo-dev/auth-react'

import Prism from 'prismjs'
import { useEffect } from 'react'

let AuthClient = Auth.create({
	project: process.env.NEXT_PUBLIC_AUTH_PROJECT ?? '',
	baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? ''
})

export default function App() {
	useEffect(() => {
	  Prism.highlightAll()
	})

	return (
	  	<AuthCtx.Provider value={AuthClient}>
	    	<AuthShell basename='ui'>
				<Route path='/' element={<DummyPage />}/>
			</AuthShell>
	  	</AuthCtx.Provider>
	)
}

let DummyPage = () => {
	let auth = useAuth()
	let user = useUser()

	return (
		<div className='demo-wrapper'>
			<button className='demo-signout' onClick={() => auth.signOut()}>
				Sign Out
			</button>

			<a href='/guides'>Get Started</a>

			<pre>
				<code className="language-json">
				{ JSON.stringify(user, null, 2) }
				</code>
			</pre>		
		</div>
	)
}