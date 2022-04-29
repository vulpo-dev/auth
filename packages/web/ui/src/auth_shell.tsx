import React, { FunctionComponent, useState, createContext, useContext } from 'react'
import { Switch, Route, useHistory, useLocation, Redirect } from 'react-router-dom'
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
	let history = useHistory()
	let location = useLocation()

	let [refferrer] = useState(() => {
		let { pathname } = window.location
		if (pathname.startsWith(basename)) {
			return '/'
		}

		return pathname
	})

	let auth = useAuth()
	let [user, setUser] = useState<UserAuthState>(() => {
		return auth.getUser() ?? undefined
	})

	useAuthStateChange((newUser) => {
		if (isVerifyEmail(window.location.hash)) {
			return
		}
		
		setUser(newUser?.user)
		if(newUser && newUser.user?.state === UserState.SetPassword) {
			return
		}

		if (!newUser && !window.location.pathname.startsWith(basename)) {
			history.replace(basename)
		}


		if (!user && newUser) {
			history.replace(refferrer)
		}
	})

	if (
		user === undefined &&
		!location.pathname.startsWith(basename) &&
		!isVerifyEmail(window.location.hash)
	) {
		return <p>...loading</p>
	}

	return (
		<UserCtx.Provider value={user}>
			<Switch>

				<Route path={basename}>
					<div className="vulpo-auth vulpo-auth-container">
						<div className="vulpo-auth-box-shadow">
							<Auth />
						</div>
					</div>
					
					{ (user && user.state !== UserState.SetPassword && !isVerifyEmail(window.location.hash)) &&
						<Redirect to={refferrer} />
					}
				</Route>

				{ children }
			</Switch>
		</UserCtx.Provider>
	)
}

export default AuthShell

function isVerifyEmail(hash: string) {
	return hash.startsWith('#/verify-email') || hash.startsWith('/verify-email')
}