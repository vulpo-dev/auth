import {
	AuthCallback,
    ErrorCode,
    IAuthClient,
} from '@vulpo-dev/auth-sdk'

import {
	createContext,
    useCallback,
	useContext,
	useEffect,
	useRef,
    useState,
} from 'react'

export let Auth = createContext<IAuthClient | null>(null)

export function useAuthStateChange(fn: AuthCallback) {
	let auth = useContext(Auth)
	let cb = useRef(fn)

	useEffect(() => {
		cb.current = fn
	})

	useEffect(() => {
		if (auth === null) {
			return
		}

		let sub = auth.authStateChange((session) => {
			cb.current(session)
		})

		return () => {
			sub.unsubscribe()
		}
	}, [auth])
}

export interface SingInWithRedirect {
	(provider: 'google'): Promise<void>;
	loading: boolean;
	error: ErrorCode | null;
}

export type UseAuth = IAuthClient & {
	singInWithRedirect: SingInWithRedirect,
}

export function useAuth(): UseAuth {
	let auth = useContext(Auth)
	
	let mounted = useRef(true)
	useEffect(() => {
		mounted.current = true
		return () => { mounted.current = false }
	}, [])

	let [redirectState, setRedirectState] = useState(false)
	let [redirectError, setRedirectError] = useState(null)

	let singInWithRedirectFn = useCallback(async (provider: 'google') => {

		if (auth === null) {
			return
		}

		setRedirectState(true)

		let url = await auth
			.oAuthGetAuthorizeUrl(provider)
			.catch(err => { mounted.current && setRedirectError(err.code) })
			.finally(() => mounted.current && setRedirectState(false))

		if (mounted.current && url) {
			window.location.href = url
		}
	}, [auth])

	let singInWithRedirect: SingInWithRedirect = Object.assign(singInWithRedirectFn, {
		loading: redirectState,
		error: redirectError,
	})

	if (auth === null) {
		throw new AuthClientError()
	}

	return Object.assign(auth, { singInWithRedirect })
}

export class AuthClientError extends Error {
	constructor() {
		super(`Can not use auth of null, did you initialize the auth client?`)
		this.name = `AuthClientError`
	}
}
