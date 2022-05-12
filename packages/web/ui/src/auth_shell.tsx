import React, { FunctionComponent, useState, createContext, useContext, ReactNode, ReactElement } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuthStateChange, useAuth } from '@riezler/auth-react'
import { UserAuthState, UserState } from '@riezler/auth-sdk'

import Auth from './auth'
import { AuthConfig, DefaultConfig, $AuthConfig, useConfig } from './context/config'
import Splashscreen from './component/splashscreen'
import { PrivateRoute, PublicRoute } from './utils'

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
	authscreen?: JSX.Element,
	dark?: boolean,
} & Partial<$AuthConfig>

let AuthShell: FunctionComponent<Props> = (props) => {
	let { basename = DefaultConfig.basename } = props

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

		if (!user && newUser) {
			navigate(referrer, { replace: true })
			return
		}
	})

	let redirect = (user && user?.state !== UserState.SetPassword && !isVerifyEmail(basename))

	let authConfig: $AuthConfig = {
		basename: props.basename ?? DefaultConfig.basename,
		tos: props.tos ?? DefaultConfig.tos,
		privacy: props.privacy ?? DefaultConfig.privacy,
		Arrow: props.Arrow ?? DefaultConfig.Arrow,
		dark: props.dark ?? DefaultConfig.dark,
	}
	
	let AuthComponent = (
		<AuthConfig.Provider value={authConfig}>
			{ props.authscreen ?? (
				<div className="vulpo-auth vulpo-auth-container">
					<div className="vulpo-auth-box-shadow">
						<Auth />
					</div>
				</div>
			)}
		</AuthConfig.Provider>
	)

	let routes = React.Children.map(props.children, (child) => {
		if (!child) {
			return null
		}

		let elm = child as ReactElement

		if (elm.type === undefined) {
			return null
		}

		if (elm.type === PublicRoute) {
			return <Route {...elm.props} />
		}

		if (elm.type === PrivateRoute || elm.type === Route) {
			return <Route {...elm.props} element={
				<PrivateRouteElement element={elm.props.element} />
			}/>
		}
	})

	let isLoading = (
		user === undefined &&
		!location.pathname.startsWith(`/${basename}`) &&
		!isVerifyEmail(basename)
	)

	let splashscreen = props.splashscreen ?? <Splashscreen
		name={props.name}
		background={props.themeColor}
	/>

	let loading = {
		loading: isLoading,
		splashscreen,
	}

	return (
		<UserCtx.Provider value={user}>
			<LoadingCtx.Provider value={loading}>			
				<Routes>
					<Route path={`${basename}/*`} element={
						redirect ? <Navigate to={referrer} /> : AuthComponent
					} />

					{ routes }
				</Routes>
			</LoadingCtx.Provider>
		</UserCtx.Provider>
	)
}

export default AuthShell

function isVerifyEmail(basename: string) {
	return window.location.pathname === `/${basename}/verify-email`
}

type LoadingCtx = {
	loading: boolean,
	splashscreen: ReactElement | null,
}

let LoadingCtx = createContext<LoadingCtx>({
	loading: true,
	splashscreen: null,
})

let PrivateRouteElement: FunctionComponent<{ element: ReactElement }> = (props) => {
	let { loading, splashscreen } = useContext(LoadingCtx)
	let navigate = useNavigate()
	let { basename } = useConfig()

	useAuthStateChange((newUser) => {
		if(newUser && newUser.user?.state === UserState.SetPassword) {
			return
		}

		if (!newUser && !window.location.pathname.startsWith(`/${basename}`)) {
			navigate(`/${basename}`)
			return
		}
	})

	if (loading) {
		return splashscreen
	}

	return props.element
}