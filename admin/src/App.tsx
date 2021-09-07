import React from 'react'
import { useState } from 'react'
import { Switch, Route, useHistory, useLocation, Redirect } from 'react-router-dom'
import { useAuthStateChange, useAuth } from '@riezler/auth-react'
import { UserState } from '@riezler/auth-sdk'
import { PageLoad } from 'component/loading'

import Dashboard from 'dashboard'
import Auth from 'auth'
import { CurrentUser } from 'auth/ctx'
import CreateProject from 'project/create'

export default function App() {
	let history = useHistory()
	let location = useLocation()

	let [referrer] = useState(() => {
		if (window.location.pathname.includes('/auth')) {
			return '/'
		}

		let admin = '/admin'
		return window.location.pathname.slice(admin.length)
	}) 

	let auth = useAuth()
	let [currentUser, setUser] = useState<UserState>(() => {
		return auth.getUser() ?? undefined
	})

	useAuthStateChange((user: UserState) => {
		setUser(user)
		if (user === null) {
			history.replace('/auth/#/signin')
		}

		if (user && !currentUser) {
			history.replace(referrer)
		}
	})

	if (currentUser === undefined) {
		return <PageLoad />
	}

	return (
		<Switch>
			<Route path='/auth'>
				{	!currentUser &&
					<Auth />
				}
				{ currentUser &&
					<Redirect to={referrer} />
				}
			</Route>

			<Route path='/project/create'>
				<CreateProject />
			</Route>

			<Route path='/'>
				<CurrentUser.Provider value={currentUser}>
					{ currentUser === null ? <PageLoad /> : <Dashboard /> }
				</CurrentUser.Provider>
			</Route>

		</Switch>
	)
}

