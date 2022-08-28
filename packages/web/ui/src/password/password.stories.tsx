import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Password, Props } from './index'
import { Translation, DefaultTranslation } from '../context/translation'
import { AuthConfig, DefaultConfig, FlagsCtx } from '../context/config'
import { ErrorCode, Flag } from '@vulpo-dev/auth-sdk'

export default {
	title: 'Password',
	component: Password,
	argTypes: {
	  ctx: {
	  	defaultValue: 'signin',
	  	control: {
		  	type: 'select',
	        options: [
	          'signin', 
	          'signup',
	        ]
	  	}
	  },
	  loading: {
	  	defaultValue: false,
	  	control: {
	  		type: 'boolean'
	  	}
	  },
	  error: {
	  	defaultValue: null,
	  	control: {
	  		type: 'select',
	  		options: [
	  			null,
	  			ErrorCode.InternalServerError,
	  			ErrorCode.InvalidEmailPassword,
	  			ErrorCode.PasswordMinLength,
	  			ErrorCode.PasswordMaxLength,
	  			ErrorCode.NotAllowed,
	  			ErrorCode.Unavailable,
	  		]
	  	}
	  },
	  flags: {
	  	defaultValue: [
  			Flag.SignIn,
  			Flag.SignUp,
  			Flag.PasswordReset,
  			Flag.AuthenticationLink
  		],
	  	control: {
	  		type: 'multi-select',
	  		options: [
	  			Flag.SignIn,
	  			Flag.SignUp,
	  			Flag.PasswordReset,
	  			Flag.AuthenticationLink
	  		]
	  	}
	  },
	  onSubmit: { action: 'handle form' },
	  onBack: { action: 'go to overview' },
	},
} as Meta

let Template: Story<Props & { flags: Array<Flag> }> = ({ flags, ...args }) => {
	return (
		<FlagsCtx.Provider value={[...flags, Flag.EmailAndPassword]}>
			<AuthConfig.Provider value={DefaultConfig}>
				<Translation.Provider value={DefaultTranslation}>
					<HashRouter>
						<Routes>
							<Route path={`email`} element={
								<div className="vulpo-auth vulpo-auth-container">
									<div className="vulpo-auth-box-shadow">
										<Password {...args} />
									</div>
								</div>
							}></Route>

							<Route path='/*' element={<Navigate to={`email`} />} />
						</Routes>
					</HashRouter>
				</Translation.Provider>
			</AuthConfig.Provider>
		</FlagsCtx.Provider>
	)
}

export let SignIn = Template.bind({})
SignIn.args = { ctx: 'signin' }

export let SignUp = Template.bind({})
SignUp.args = { ctx: 'signup' }