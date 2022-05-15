import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Overview } from 'overview'
import { Translation, DefaultTranslation } from 'context/translation'
import { FlagsCtx } from 'context/config'

import { Auth as AuthClient, Flag } from '@vulpo-dev/auth-sdk'
import { Auth as AuthCtx } from '@vulpo-dev/auth-react'

let auth = AuthClient.create({
	project: 'ae16cc4a-33be-4b4e-a408-e67018fe453b',
	baseURL: 'http://127.0.0.1:8000',
})

export default {
	title: 'Overview',
	component: Overview,
	argTypes: {
	  flags: {
	  	defaultValue: [
  			Flag.SignIn,
  			Flag.SignUp,
  			Flag.AuthenticationLink,
  			Flag.EmailAndPassword,
  			Flag.OAuthGoogle,
  		],
	  	control: {
	  		type: 'multi-select',
	  		options: [
	  			Flag.SignIn,
	  			Flag.SignUp,
	  			Flag.AuthenticationLink,
	  			Flag.EmailAndPassword,
	  			Flag.OAuthGoogle,
	  		]
	  	}
	  }
	},
} as Meta

let Template: Story<{ flags: Array<Flag> }> = ({ flags }) => {
	return (
		<AuthCtx.Provider value={auth}>
			<FlagsCtx.Provider value={flags}>	
				<Translation.Provider value={DefaultTranslation}>
					<HashRouter>
						<Routes>

							<Route path='/:type' element={
								<div className="vulpo-auth vulpo-auth-container">
									<div className="vulpo-auth-box-shadow">
										<Overview />
									</div>
								</div>
							}></Route>

							<Route path='signin' element={<Navigate to='/signin' />}/>
						</Routes>
					</HashRouter>
				</Translation.Provider>
			</FlagsCtx.Provider>
		</AuthCtx.Provider>
	)
}

export let Default = Template.bind({})