import { createContext, useContext } from 'react'
import { UserAuthState } from '@vulpo-dev/auth-sdk'

export let CurrentUser = createContext<UserAuthState>(null)

export function useCurrentUser() {
	return useContext(CurrentUser)
}
