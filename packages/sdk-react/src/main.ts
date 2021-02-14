import type {
	AuthClient,
	AuthCallback,
	UserState,
	User,
	SetPassword,
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

		let sub = auth.authStateChange((user: User) => {
			cb.current(user)
		})

		return () => {
			sub.unsubscribe()
		}
	}, [auth])
}

type UseAuth = {
	user: UserState,
	signIn: (email: string, password: string) => Promise<User>,
	signUp: (email: string, password: string) => Promise<User>,
	signOut: (useId?: string) => Promise<void>,
	resetPassword: (email: string) => Promise<void>,
	setPassword: (body: SetPassword) => Promise<void>,
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

	let signOut = useCallback((userId?: string) => {
		if (auth === null) {
			throw new AuthClientError('signOut')
		}

		return auth.signOut(userId)
	}, [auth])

	let resetPassword = useCallback((email: string) => {
		if (auth === null) {
			throw new AuthClientError('resetPassword')
		}

		return auth.resetPassword(email)
	}, [auth])

	let setPassword = useCallback((value: SetPassword) => {
		if (auth === null) {
			throw new AuthClientError('setPassword')
		}

		return auth.setPassword(value)
	}, [auth])

	return {
		user,
		signIn,
		signOut,
		signUp,
		resetPassword,
		setPassword,
	}
}

export class AuthClientError extends Error {
	constructor(name: string) {
		super(`Can not call ${name} of null, did you initialize the auth client?`)
		this.name = 'AuthClientError'
	}
}