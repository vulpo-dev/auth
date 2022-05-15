import React, { Fragment } from 'react'
import styled from 'styled-components'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from 'component/layout'

import {
	DefaultConfig,
	AuthConfig,
	DefaultTranslation,
	Translation,
	Password,
	FlagsCtx,
	SetPassword
} from '@vulpo-dev/auth-ui'
import { Flag } from '@vulpo-dev/auth-sdk'

export let Auth = () => {
	return (
		<Fragment>
			<Header>
				<h1>Authentication</h1>
			</Header>
			<Wrapper>
				<FlagsCtx.Provider value={[Flag.EmailAndPassword]}>
					<Translation.Provider value={DefaultTranslation}>
						<AuthConfig.Provider value={DefaultConfig}>
							<div className="vulpo-auth-box-shadow">
								<Routes>
									<Route path='/set_password' element={<SetPassword />} />
									<Route path='/signin' element={<Password redirectTo='/set_password' />} />
								</Routes>
							</div>
						</AuthConfig.Provider>
					</Translation.Provider>
				</FlagsCtx.Provider>
			</Wrapper>
		</Fragment>
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