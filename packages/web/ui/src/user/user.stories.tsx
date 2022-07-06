import { Story, Meta } from '@storybook/react/types-6-0'
import { ErrorCode } from '@vulpo-dev/auth-sdk'

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Translation, DefaultTranslation } from '../context/translation'
import { AuthConfig, DefaultConfig } from '../context/config'
import { SetPassword, Props as SetPasswordProps } from './set_password'

export default {
	title: 'User',
} as Meta

let NewPassword: Story<SetPasswordProps> = (args) => {
	return (
		<AuthConfig.Provider value={DefaultConfig}>
			<Translation.Provider value={DefaultTranslation}>
				<HashRouter>
					<Routes>

						<Route path='/signin/set_password' element={
							<div className="vulpo-auth vulpo-auth-container">
								<div className="vulpo-auth-box-shadow">
									<SetPassword {...args} />
								</div>
							</div>
						}></Route>

						<Route element={<Navigate to='/signin/set_password' />} />
						
					</Routes>
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
	onSubmit: { action: 'reset password' },
}