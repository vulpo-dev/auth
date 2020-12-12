import React from 'react'
import { useState } from 'react'
import { Switch, Route, useHistory } from 'react-router-dom'
import { useAuthStateChange } from '@riezler/auth-react'
import { UserState } from '@riezler/auth-sdk'
import { PageLoad } from 'component/loading'


import Setup from 'setup'
import Dashboard from 'dashboard'
import Auth from 'auth'

export default function App() {
	let history = useHistory()
	let [user, setUser] = useState<UserState>()

	useAuthStateChange((user: UserState) => {
		setUser(user)
		if (user === null) {
			history.replace('/auth/#/signin')
		}

		if (user) {
			history.replace({ pathname: '/', hash: '' })
		}
	})

	if (user === undefined) {
		return <PageLoad />
	}

	return (
		<Switch>
			<Route path='/setup'>
				<Setup />
			</Route>

			<Route path='/auth'>
				<Auth />
			</Route>

			<Route path='/'>
				<Dashboard />
			</Route>

		</Switch>
	)
}

