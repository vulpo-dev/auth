import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'

import { HashRouter, Switch, Route, Redirect } from 'react-router-dom'
import { Password, Props } from 'password'
import { Container } from 'component/layout'
import { Translation, DefaultTranslation } from 'context/translation'
import { AuthConfig, DefaultConfig, FlagsCtx } from 'context/config'
import { ErrorCode, Flag } from '@riezler/auth-sdk'
import { BoxShadow } from 'component/card'

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
						<Switch>
							<Route path='/signin/email'>
								<Container>
									<BoxShadow>
										<Password {...args} />
									</BoxShadow>
								</Container>
							</Route>

							<Redirect to='/signin/email' />
						</Switch>
					</HashRouter>
				</Translation.Provider>
			</AuthConfig.Provider>
		</FlagsCtx.Provider>
	)
}

export let Default = Template.bind({})