import React, { useState } from 'react'
import App from './App'
import { Switch, Route, useHistory, useLocation, Redirect } from 'react-router-dom'
import { useAuthStateChange, useAuth } from '@riezler/auth-react'
import { UserState, SessionInfo } from '@riezler/auth-sdk'
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
	let [user, setUser] = useState<UserState>(() => {
		return auth.getUser() ?? undefined
	})

	useAuthStateChange((newUser: SessionInfo) => {
		if (window.location.hash.startsWith('#/verify-email')) {
			return
		}
		
		setUser(newUser?.user)
		if(newUser && newUser.user.state === 'SetPassword') {
			history.replace('/auth/#/user/set_password')
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
				
				{ (user && user.state !== 'SetPassword') &&
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