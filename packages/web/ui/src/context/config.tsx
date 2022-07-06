import { ReactNode, createContext, useContext } from 'react'
import { Flag } from '@vulpo-dev/auth-sdk'

import Arrow from '../component/arrow'

export type $AuthConfig = {
	tos: string;
	privacy: string;
	Arrow: ReactNode;
	basename: string;
	dark: boolean;
}

export let DefaultConfig = {
	tos: '',
	privacy: '',
	Arrow: <Arrow />,
	basename: 'auth',
	dark: false,
}

export let AuthConfig = createContext<$AuthConfig>(DefaultConfig)

export function useConfig(): $AuthConfig {
	return useContext(AuthConfig)
}

export let FlagsCtx = createContext<Array<Flag>>([])

export function useFlags() {
	return useContext(FlagsCtx)
}