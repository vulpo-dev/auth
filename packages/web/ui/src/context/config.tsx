import React from 'react'
import { createContext, useContext } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Flag } from '@riezler/auth-sdk'

import Arrow from '../component/arrow'

type $AuthConfig = {
	tos: string;
	privacy: string;
	Arrow: JSX.Element;
	basename: string;
}

export let DefaultConfig = {
	tos: '',
	privacy: '',
	Arrow: <Arrow />,
	basename: 'auth'
}

export let AuthConfig = createContext<$AuthConfig>(DefaultConfig)

export function useConfig(): $AuthConfig {
	return useContext(AuthConfig)
}

export let FlagsCtx = createContext<Array<Flag>>([])

export function useFlags() {
	return useContext(FlagsCtx)
}