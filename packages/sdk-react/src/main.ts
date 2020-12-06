import type {
	AuthClient,
	AuthCallback,
	UserState,
	User
} from '@riezler/auth-sdk'

import {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
	useCallback,
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

		let unsub = auth.authStateChange((user: User) => {
			cb.current(user)
		})

		return () => {
			unsub()
		}
	}, [auth])
}

type UseAuth = {
	user: UserState,
	signIn: (e: string, p: string) => Promise<User>,
	signUp: (e: string, p: string) => Promise<User>,
	signOut: (e: string, p: string) => Promise<void>,
}

export function useAuth(): UseAuth {
	let auth = useContext(Auth)
	let [user, setUser] = useState<UserState>()

	useAuthStateChange((user: UserState) => setUser(user))

	let signIn = useCallback((email: string, password: string) => {
		if (auth === null) {
			throw new AuthClientError('signIn')
		}

		return auth.signIn(email, password)
	}, [auth])

	let signUp = useCallback((email: string, password: string) => {
		if (auth === null) {
			throw new AuthClientError('signUp')
		}

		return auth.signUp(email, password)
	}, [auth])

	let signOut = useCallback(() => {
		if (auth === null) {
			throw new AuthClientError('signOut')
		}

		return auth.signOut()
	}, [auth])

	return {
		user,
		signIn,
		signOut,
		signUp,
	}
}

export class AuthClientError extends Error {
	constructor(name: string) {
		super(`Can not call ${name} of null, did you initialize the auth client?`)
		this.name = 'AuthClientError'
	}
}