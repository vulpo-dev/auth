import React from 'react'
import { useState } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { useAuthStateChange, useAuth } from '@vulpo-dev/auth-react'
import { UserAuthState, UserState } from '@vulpo-dev/auth-sdk'
import { PageLoad } from 'component/loading'

import Dashboard from 'dashboard'
import Auth from 'auth'
import { CurrentUser } from 'auth/ctx'
import CreateProject from 'project/create'

export default function App() {
	let navigate = useNavigate()

	let [referrer] = useState(() => {
		let admin = '/dashboard'
		let pathname = window.location.pathname.slice(admin.length)

		if (pathname === '' || pathname.includes('/auth')) {
			return '/'
		}

		return pathname
	}) 

	let auth = useAuth()
	let [currentUser, setUser] = useState<UserAuthState>(() => {
		return auth.getUser() ?? undefined
	})

	useAuthStateChange((session) => {
		let user = session ? session.user : session
		setUser(user)


		if (user?.state === UserState.SetPassword) {
			navigate('auth/set_password', { replace: true })
			return
		}

		if (session === null) {
			navigate('auth/signin', { replace: true })
			return
		}

		if (session && !currentUser) {
			navigate(referrer, { replace: true })
		}
	})

	if (currentUser === undefined) {
		return <PageLoad />
	}

	let redirect = (currentUser && currentUser.state !== UserState.SetPassword)

	return (
		<Routes>
			<Route
				path='auth/*'
				element={redirect ? <Navigate to={referrer} /> : <Auth />}>
			</Route>

			<Route path='project/create' element={<CreateProject />} />

			<Route path='/*' element={
				<CurrentUser.Provider value={currentUser}>
					{ currentUser === null ? <PageLoad /> : <Dashboard /> }
				</CurrentUser.Provider>
			}></Route>
		</Routes>
	)
}

