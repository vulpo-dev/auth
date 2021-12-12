import React, { useState } from 'react'
import App from './App'
import { Switch, Route, useHistory, useLocation, Redirect } from 'react-router-dom'
import { useAuthStateChange, useAuth } from '@riezler/auth-react'
import { UserAuthState, UserState } from '@riezler/auth-sdk'
import { Auth, Container, BoxShadow } from '@riezler/auth-ui'

let Bootstrap = () => {
	let history = useHistory()
	let location = useLocation()
	let [refferrer] = useState(() => {
		let { pathname } = window.location
		if (pathname.startsWith('/auth')) {
			return '/'
		}

		return pathname
	})

	let auth = useAuth()
	let [user, setUser] = useState<UserAuthState>(() => {
		return auth.getUser() ?? undefined
	})

	useAuthStateChange((newUser) => {
		if (window.location.hash.startsWith('#/verify-email')) {
			return
		}
		
		setUser(newUser?.user)
		if(newUser && newUser.user?.state === UserState.SetPassword) {
			return
		}

		if (!newUser && !window.location.pathname.startsWith('/auth')) {
			history.replace('/auth')
		}


		if (!user && newUser) {
			history.replace(refferrer)
		}
	})

	if (user === undefined && !location.pathname.startsWith('/auth')) {
		return <p>...loading</p>
	}

	return (
		<Switch>

			<Route path='/auth'>
				<Container>
					<BoxShadow>
						<Auth />
					</BoxShadow>
				</Container>
				
				{ (user && user.state !== UserState.SetPassword) &&
					<Redirect to={refferrer} />
				}
			</Route>

			<Route path='/page'>
				<Page />
			</Route>

			<Route path='/'>
				<App />
			</Route>
		</Switch>
	)
}

export default Bootstrap

function Page() {
	return (
		<h1>Page</h1>
	)
}