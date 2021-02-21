import React, { useState, useRef } from 'react'
import App from './App'
import { Switch, Route, useHistory, useLocation } from 'react-router-dom'
import { useAuthStateChange } from '@riezler/auth-react'
import { UserState } from '@riezler/auth-sdk'
import { Auth, Container } from '@riezler/auth-ui'

let Bootstrap = () => {
	let history = useHistory()
	let location = useLocation()
	let refferrer = useRef(window.location.pathname)

	let [user, setUser] = useState<UserState>(undefined)

	useAuthStateChange((newUser: UserState) => {
		console.log({ newUser })
		
		setUser(newUser)

		if (!newUser && !location.pathname.startsWith('/auth')) {
			history.replace('/auth')
		}

		if (!user && newUser) {
			if (refferrer.current.startsWith('/auth')) {
				history.replace('/')
			} else {
				history.replace(refferrer.current)
			}
		}
	})

	if (user === undefined && !location.pathname.startsWith('/auth')) {
		return <p>...loading</p>
	}

	return (
		<Switch>

			<Route path='/auth'>
				<Container>
					<Auth />
				</Container>
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