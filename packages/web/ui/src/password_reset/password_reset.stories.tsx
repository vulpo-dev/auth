import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Translation, DefaultTranslation } from 'context/translation'
import { AuthConfig, DefaultConfig } from 'context/config'
import { ErrorCode } from '@vulpo-dev/auth-sdk'

import { PasswordReset, Props } from 'password_reset'
import { CheckReset } from 'password_reset/check'
import { SetPassword, Props as SetPasswordProps } from 'password_reset/set_password'

export default {
	title: 'Password Reset',
	component: PasswordReset,
} as Meta

let Template: Story<Props> = args => {
	return (
		<AuthConfig.Provider value={DefaultConfig}>
			<Translation.Provider value={DefaultTranslation}>
				<HashRouter>
					<Routes>

						<Route path='/signin/password_reset' element={
							<div className="vulpo-auth vulpo-auth-container">
								<div className="vulpo-auth-box-shadow">
									<PasswordReset {...args} />
								</div>
							</div>
						}></Route>

						<Route element={<Navigate to='/signin/password_reset' />} />
					</Routes>
				</HashRouter>
			</Translation.Provider>
		</AuthConfig.Provider>
	)
}

export let EnterEmail = Template.bind({})

EnterEmail.argTypes = {
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
				ErrorCode.NotAllowed,
				ErrorCode.Unavailable,
			]
		}
	},
	onReset: { action: 'handle reset' },
	onBack: { action: 'go to signin' },
}

let CheckEmailTemplate: Story<{ email: string | null }> = (args) => {
	return (
		<AuthConfig.Provider value={DefaultConfig}>
			<Translation.Provider value={DefaultTranslation}>
				<HashRouter>
					<Routes>

						<Route path='/signin/check_email' element={
							<div className="vulpo-auth vulpo-auth-container">
								<div className="vulpo-auth-box-shadow">
									<CheckReset {...args} />
								</div>
							</div>
						}></Route>

						<Route element={<Navigate to='/signin/check_email' />} />
					</Routes>
				</HashRouter>
			</Translation.Provider>
		</AuthConfig.Provider>
	)
}

export let CheckEmail = CheckEmailTemplate.bind({})

CheckEmail.argTypes = {
	email: {
		defaultValue: 'michael@riezler.co',
		control: {
			type: 'text'
		}
	},
}

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

export let VerifyToken: Story<SetPasswordProps> = (args) => {
	return (
		<AuthConfig.Provider value={DefaultConfig}>
			<Translation.Provider value={DefaultTranslation}>
				<HashRouter>
					<Routes>

						<Route path='/signin/set_password' element={
							<div className="vulpo-auth vulpo-auth-container">
								<div className="vulpo-auth-box-shadow">
									<SetPassword {...args} verifyToken={true} />
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
	verifyToken: {
		defaultValue: false,
		control: {
			type: 'boolean'
		}
	},
	onSubmit: { action: 'reset password' },
}