import { createContext, useContext } from 'react'
import { UserState } from '@riezler/auth-sdk'

export let CurrentUser = createContext<UserState>(null)

export function useCurrentUser() {
	return useContext(CurrentUser)
}
