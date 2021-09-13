import React from 'react'
import { Fragment } from 'react'
import styled from 'styled-components'
import { HashRouter, Switch, Route } from 'react-router-dom'
import { Header } from 'component/layout'

import {
	DefaultConfig,
	AuthConfig,
	DefaultTranslation,
	Translation,
	Password,
	BoxShadow,
	FlagsCtx,
	SetPassword
} from '@riezler/auth-ui'
import { Flag } from '@riezler/auth-sdk'

export let Auth = () => {
	return (
		<HashRouter>
			<Header>
				<h1>Authentication</h1>
			</Header>
			<Wrapper>
				<FlagsCtx.Provider value={[Flag.EmailAndPassword]}>
					<Translation.Provider value={DefaultTranslation}>
						<AuthConfig.Provider value={DefaultConfig}>
							<BoxShadow>
								<Switch>
									<Route path='/set_password'>
										<SetPassword />
									</Route>

									<Route path='/signin'>
										<Password redirectTo='/set_password' />	
									</Route>
								</Switch>
							</BoxShadow>
						</AuthConfig.Provider>
					</Translation.Provider>
				</FlagsCtx.Provider>
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

	--input-border: 1px solid rgba(34,36,38,.15);
	--input-color: rgba(0,0,0,.87);
	--input-bg: none;
`