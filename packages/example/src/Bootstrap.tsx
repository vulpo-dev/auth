import React, { useState } from 'react'
import App from './App'
import { Switch, Route, useHistory, useLocation } from 'react-router-dom'
import { useAuthStateChange } from '@riezler/auth-react'
import { UserState } from '@riezler/auth-sdk'
import { Auth, Container } from '@riezler/auth-ui'

let Bootstrap = () => {
	let history = useHistory()
	let location = useLocation()

	let [user, setUser] = useState<UserState>(undefined)

	useAuthStateChange((newUser: UserState) => {
		console.log({ newUser })
		
		setUser(newUser)

		if (!newUser) {
			history.replace('/auth')
		}

		if (!user && newUser) {
			history.replace('/')
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

			<Route path='/'>
				<App />
			</Route>
		</Switch>
	)
}

export default Bootstrap