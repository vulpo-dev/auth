import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'

import { HashRouter, Switch, Route, Redirect } from 'react-router-dom'
import { Container } from 'component/layout'
import { BoxShadow } from 'component/card'
import { Translation, DefaultTranslation } from 'context/translation'
import { AuthConfig, DefaultConfig } from 'context/config'
import { ErrorCode } from '@riezler/auth-sdk'

import { SetPassword, Props as SetPasswordProps } from 'user/set_password'

export default {
	title: 'User',
} as Meta

let NewPassword: Story<SetPasswordProps> = (args) => {
	return (
		<AuthConfig.Provider value={DefaultConfig}>
			<Translation.Provider value={DefaultTranslation}>
				<HashRouter>
					<Switch>

						<Route path='/signin/set_password'>
							<Container>
								<BoxShadow>
									<SetPassword {...args} />
								</BoxShadow>
							</Container>
						</Route>

						<Redirect to='/signin/set_password' />
					</Switch>
				</HashRouter>
			</Translation.Provider>
		</AuthConfig.Provider>
	)
}

export let SetNewPassword = NewPassword.bind({})

SetNewPassword.argTypes = {
	error: {
		defaultValue: null,
		control: {
			type: 'select',
			options: [
				null,
				ErrorCode.InternalServerError,
				ErrorCode.NotAllowed,
				ErrorCode.Unavailable,
				ErrorCode.ResetInvalidToken,
				ErrorCode.ResetTokenNotFound,
				ErrorCode.ResetExpired,
				ErrorCode.ResetPasswordMismatch,
			]
		}
	},
	loading: {
		defaultValue: false,
		control: {
			type: 'boolean'
		}
	},
	verifyToken: {
		defaultValue: false,
		control: {
			type: 'boolean'
		}
	},
	onSubmit: { action: 'reset password' },
}