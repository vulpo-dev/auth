import React from 'react'
import { Fragment } from 'react'
import styled from 'styled-components'
import { HashRouter } from 'react-router-dom'
import { Header } from 'component/layout'

import {
	DefaultConfig,
	AuthConfig,
	DefaultTranslation,
	Translation,
	Password
} from '@riezler/auth-ui'

export let Auth = () => {
	return (
		<HashRouter>
			<Header>
				<h1>Authentication</h1>
			</Header>
			<Wrapper>
				<Translation.Provider value={DefaultTranslation}>
					<AuthConfig.Provider value={DefaultConfig}>
						<Password />	
					</AuthConfig.Provider>
				</Translation.Provider>
			</Wrapper>
		</HashRouter>
	)
}

export default Auth

let Wrapper = styled.div`
	display: flex;
	padding-top: calc(var(--baseline) * 21 - var(--baseline-5));
	justify-content: center;
	align-items: flex-start;
	height: 100%;
`