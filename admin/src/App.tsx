import React from 'react'
import { useState } from 'react'
import { Switch, Route, useHistory, useLocation } from 'react-router-dom'
import { useAuthStateChange, useAuth } from '@riezler/auth-react'
import { UserState } from '@riezler/auth-sdk'
import { PageLoad } from 'component/loading'

import Dashboard from 'dashboard'
import Auth from 'auth'

export default function App() {
	let history = useHistory()
	let location = useLocation()

	let [user, setUser] = useState<UserState>()
	let auth = useAuth()

	useAuthStateChange((user: UserState) => {
		setUser(user)
		if (user === null) {
			history.replace('/auth/#/signin')
		}

		if (user) {
			history.replace({
				pathname: '/',
				hash: location.hash
			})
		}
	})

	if (user === undefined) {
		return <PageLoad />
	}

	return (
		<Switch>
			<Route path='/auth'>
				<Auth />
			</Route>

			<Route path='/'>
				<Dashboard />
			</Route>

		</Switch>
	)
}

