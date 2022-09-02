import {
	FunctionComponent,
	useState,
	createContext,
	useContext,
	ReactNode,
	ReactElement,
	Children,
} from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuthStateChange, useAuth } from '@vulpo-dev/auth-react'
import { UserAuthState, UserState } from '@vulpo-dev/auth-sdk'

import Auth from './auth'
import { AuthConfig, DefaultConfig, $AuthConfig, useConfig } from './context/config'
import Splashscreen from './component/splashscreen'
import { PrivateRoute, PublicRoute } from './utils'

export let UserCtx = createContext<UserAuthState>(undefined)

/**
 * returns a User if a user exists.
 * on public routes `undefined` is returned while the user is still loading
 * if no user is logged in, `null` will be returned.
 */
export function useUser() {
	return useContext(UserCtx)
}

export type AuthShellProps = {
	children?: ReactNode,

	/** set a default redirect after successful authentication */
	redirect?: string,
	
	/** The name that will be displayed on the splashscreen */
	name?: string,

	/** The background color of the splashscreen */
	themeColor?: string,

	/** Provide a custom splashscreen */
	splashscreen?: JSX.Element,

	/** Provide a custom authentication screen*/
	authscreen?: JSX.Element,

	/** toggle light/dark mode, defaults to false*/
	dark?: boolean,
} & Partial<$AuthConfig>


/**
 * The authentication shell manages the authentication
 * state for your application. You can pass either public
 * or private routes as children.
 * 
 * Public routes are accessible even when the user is not signed in.
 * Private routes on the other hand require the user to be authenticated.
 * If an unauthenticated user tries to access a private route, they will
 * get redirected to the authentication screen where they are able to either
 * sign in or sign up. On success full sign in/up the user will be redirected
 * to the inital referrer.
 * 
 * ```
 * <AuthShell>
 *   <PrivateRoute element={} />
 *   <PublicRoute element={} />
 * </AuthShell>
 * ```
*/
let AuthShell: FunctionComponent<AuthShellProps> = (props) => {
	let { basename = DefaultConfig.basename } = props

	let navigate = useNavigate()
	let location = useLocation()

	let [referrer] = useState(() => {
		let { pathname } = window.location

		let useDefaultRedirect = (
			pathname.startsWith(`/${basename}`)
		)

		if (useDefaultRedirect) {
			return props.redirect ?? '/'
		}

		return pathname
	})

	let auth = useAuth()
	let [user, setUser] = useState<UserAuthState>(() => {
		return auth.getUser() ?? undefined
	})

	useAuthStateChange((newUser) => {
		if (isPublicRoute(basename)) {
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

	let redirect = (
		user &&
		user?.state !== UserState.SetPassword &&
		!isPublicRoute(basename)
	)

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

	let routes = Children.map(props.children, (child) => {
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
		!isPublicRoute(basename)
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

function isPublicRoute(basename: string): boolean {
	let ROUTES = [
		`/${basename}/user/change-email/confirm`,
		`/${basename}/user/change-email/reset`,
		`/${basename}/verify-email`,
	]

	return ROUTES.includes(window.location.pathname)
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
