import React, { FunctionComponent, useState, createContext, useContext } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuthStateChange, useAuth } from '@riezler/auth-react'
import { UserAuthState, UserState } from '@riezler/auth-sdk'

import Auth from './auth'
import { useConfig } from './context/config'

export let UserCtx = createContext<UserAuthState>(undefined)

export function useUser() {
	return useContext(UserCtx)
}

let AuthShell: FunctionComponent = ({ children }) => {
	let { basename } = useConfig()
	let navigate = useNavigate()
	let location = useLocation()

	let [referrer] = useState(() => {
		let { pathname } = window.location
		if (pathname.startsWith(`/${basename}`)) {
			return '/'
		}

		return pathname
	})

	let auth = useAuth()
	let [user, setUser] = useState<UserAuthState>(() => {
		return auth.getUser() ?? undefined
	})

	useAuthStateChange((newUser) => {
		if (isVerifyEmail(basename)) {
			return
		}
		
		setUser(newUser?.user)
		if(newUser && newUser.user?.state === UserState.SetPassword) {
			return
		}

		if (!newUser && !window.location.pathname.startsWith(`/${basename}`)) {
			navigate(basename, { replace: true })
			return
		}


		if (!user && newUser) {
			navigate(referrer, { replace: true })
			return
		}
	})

	if (
		user === undefined &&
		!location.pathname.startsWith(`/${basename}`) &&
		!isVerifyEmail(window.location.hash)
	) {
		return <p>...loading</p>
	}


	let redirect = (user && user.state !== UserState.SetPassword && !isVerifyEmail(window.location.hash))
	let AuthComponent = (
		<div className="vulpo-auth vulpo-auth-container">
			<div className="vulpo-auth-box-shadow">
				<Auth />
			</div>
		</div>
	)

	return (
		<UserCtx.Provider value={user}>
			<Routes>
				<Route path={`${basename}/*`} element={
					redirect ? <Navigate to={referrer} /> : AuthComponent
				} />

				{ children }
			</Routes>
		</UserCtx.Provider>
	)
}

export default AuthShell

function isVerifyEmail(basename: string) {
	return window.location.pathname === `/${basename}/verify-email`
}