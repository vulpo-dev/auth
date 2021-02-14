import React from 'react'
import { createContext, useContext } from 'react'
import Arrow from 'component/arrow'

type $AuthConfig = {
	tos: string;
	privacy: string;
	Arrow: JSX.Element
}

export let DefaultConfig = {
	tos: '',
	privacy: '',
	Arrow: <Arrow />
}

export let AuthConfig = createContext<$AuthConfig>(DefaultConfig)

export function useConfig(): $AuthConfig {
	return useContext(AuthConfig)
}