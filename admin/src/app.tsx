import React from 'react'
import { useState } from 'react'
import { Switch, Route, useHistory, Redirect } from 'react-router-dom'
import { useAuthStateChange, useAuth } from '@riezler/auth-react'
import { UserState } from '@riezler/auth-sdk'
import { PageLoad } from 'component/loading'

import Dashboard from 'dashboard'
import Auth from 'auth'
import { CurrentUser } from 'auth/ctx'
import CreateProject from 'project/create'

export default function App() {
	let history = useHistory()

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

	useAuthStateChange((session) => {
		console.log({ session })
		let user = session ? session.user : session
		setUser(user)


		if (user?.state === 'SetPassword') {
			history.replace('/auth/#/set_password')
			return
		}

		if (session === null) {
			history.replace('/auth/#/signin')
		}

		if (session && !currentUser) {
			history.replace(referrer)
		}
	})

	if (currentUser === undefined) {
		return <PageLoad />
	}

	return (
		<Switch>
			<Route path='/auth'>

				<Auth />

				{ (currentUser && currentUser.state !== 'SetPassword') &&
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

