import React, { FunctionComponent, useState, createContext, useContext, ReactNode } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuthStateChange, useAuth } from '@riezler/auth-react'
import { UserAuthState, UserState } from '@riezler/auth-sdk'

import Auth from './auth'
import { useConfig } from './context/config'
import Splashscreen from './component/splashscreen'

export let UserCtx = createContext<UserAuthState>(undefined)

export function useUser() {
	return useContext(UserCtx)
}

type Props = {
	children?: ReactNode,
	redirect?: string,
	name?: string,
	themeColor?: string,
	splashscreen?: JSX.Element,
}

let AuthShell: FunctionComponent<Props> = (props) => {
	let { basename } = useConfig()
	let navigate = useNavigate()
	let location = useLocation()

	let [referrer] = useState(() => {
		let { pathname } = window.location
		if (pathname.startsWith(`/${basename}`)) {
			return props.redirect ?? '/'
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
		!isVerifyEmail(basename)
	) {
		return props.splashscreen ?? <Splashscreen
			name={props.name}
			background={props.themeColor}
		/>
	}

	let redirect = (user && user?.state !== UserState.SetPassword && !isVerifyEmail(basename))
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

				{ props.children }
			</Routes>
		</UserCtx.Provider>
	)
}

export default AuthShell

function isVerifyEmail(basename: string) {
	return window.location.pathname === `/${basename}/verify-email`
}