import { Fragment } from 'react'
import styled from 'styled-components'
import { HashRouter } from 'react-router-dom'
import { Header } from 'component/layout'
import { useAuth } from '@riezler/auth-react'

import {
	DefaultConfig,
	AuthConfig,
	DefaultTranslation,
	Translation,
	Password
} from '@riezler/auth-ui'

export let Auth = () => {
	let auth = useAuth()
	return (
		<HashRouter>
			<Header>
				<h1>Authentication</h1>
			</Header>
			<Wrapper>
				<AuthConfig.Provider value={DefaultConfig}>
					<Translation.Provider value={DefaultTranslation}>
						<Password />	
					</Translation.Provider>
				</AuthConfig.Provider>
			</Wrapper>
		</HashRouter>
	)
}

export default Auth

let Wrapper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;
`