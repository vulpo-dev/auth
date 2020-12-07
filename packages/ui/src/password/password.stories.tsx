import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'

import { HashRouter, Switch, Route, Redirect } from 'react-router-dom'
import { Password, Props } from 'password'
import { Container } from 'component/layout'
import { Translation, DefaultTranslation } from 'context/translation'
import { AuthConfig, DefaultConfig } from 'context/config'
import { ErrorCode } from '@riezler/auth-sdk'

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
	  			ErrorCode.AuthPasswordLength,
	  			ErrorCode.NotAllowed,
	  		]
	  	}
	  },
	  onSubmit: { action: 'handle form' },
	  onBack: { action: 'go to overview' },
	},
} as Meta

let Template: Story<Props> = args => {
	return (
		<AuthConfig.Provider value={DefaultConfig}>
			<Translation.Provider value={DefaultTranslation}>
				<HashRouter>
					<Switch>

						<Route path='/signin/email'>
							<Container>
								<Password {...args} />
							</Container>
						</Route>

						<Redirect to='/signin/email' />
					</Switch>
				</HashRouter>
			</Translation.Provider>
		</AuthConfig.Provider>
	)
}

export let Default = Template.bind({})