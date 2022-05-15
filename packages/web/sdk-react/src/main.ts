import {
	AuthClient,
	AuthCallback,
} from '@vulpo-dev/auth-sdk'

import {
	createContext,
    useCallback,
	useContext,
	useEffect,
	useRef,
    useState,
} from 'react'

export let Auth = createContext<AuthClient | null>(null)

export function useAuthStateChange(fn: AuthCallback) {
	let auth = useContext(Auth)
	let cb = useRef(fn)

	useRef(() => {
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

interface SingInWithRedirect {
	(provider: 'google'): Promise<void>;
	loading: boolean;
}

type UseAuth = AuthClient & {
	singInWithRedirect: SingInWithRedirect,
}

export function useAuth(): UseAuth {
	let auth = useContext(Auth)
	
	let mounted = useRef(true)
	useEffect(() => () => {
		mounted.current = false
	}, [])

	let [redirectState, setRedirectState] = useState(false)

	let singInWithRedirectFn = useCallback(async (provider: 'google') => {

		if (auth === null) {
			return
		}

		setRedirectState(true)

		let url = await auth.oAuthGetAuthorizeUrl(provider)

		if (mounted.current) {
			window.location.href = url
			setRedirectState(false)
		}
	}, [auth])

	let singInWithRedirect: SingInWithRedirect = Object.assign(singInWithRedirectFn, { loading: redirectState })

	if (auth === null) {
		throw new AuthClientError('signIn')
	}


	return Object.assign(auth, { singInWithRedirect })
}

export class AuthClientError extends Error {
	constructor(name: string) {
		super(`Can not use auth of null, did you initialize the auth client?`)
		this.name = `AuthClientError: ${name}`
	}
}
