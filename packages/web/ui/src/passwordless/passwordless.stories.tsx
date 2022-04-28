import React from 'react'

import { Story, Meta } from '@storybook/react/types-6-0'
import { action } from '@storybook/addon-actions'
import { HashRouter } from 'react-router-dom'

import { AuthConfig, DefaultConfig } from 'context/config'
import { Translation, DefaultTranslation } from 'context/translation'
import { EnterEmail } from 'passwordless/enter_email'
import { CheckEmail } from 'passwordless/check'
import { Confirm } from 'passwordless/confirm'
import { ErrorCode } from '@riezler/auth-sdk'

export default {
	title: 'Passwordless',
} as Meta

export let Enter: Story = () => {
	return (
		<HashRouter>
			<div className="vulpo-auth vulpo-auth-container">
				<div className="vulpo-auth-box-shadow">
					<EnterEmail
						loading={false}
						error={null}
						onBack={action('onBack')}
						onSignIn={action('onSignIn')}
						ctx='signin'
					/>
				</div>
			</div>
		</HashRouter>
	)
}

Enter.storyName = 'Enter Email'

export let Check: Story = () => {
	return (	
		<div className="vulpo-auth vulpo-auth-container">
			<div className="vulpo-auth-box-shadow">
				<CheckEmail
					email='michael@riezler.co'
					type='signin'
				/>
			</div>
		</div>
	)
}

Check.storyName = 'Check Email'

export let ConfirmAuth: Story = () => {
	return (
		<HashRouter>		
			<div className="vulpo-auth vulpo-auth-container">
				<div className="vulpo-auth-box-shadow">
					<Confirm
						loading
						error={null}
					/>
				</div>
			</div>
		</HashRouter>
	)
}

export let ConfirmError: Story = () => {
	return (
		<HashRouter>
			<div className="vulpo-auth vulpo-auth-container">
				<div className="vulpo-auth-box-shadow">
					<Confirm
						loading={false}
						error={ErrorCode.GenericError}
					/>
				</div>
			</div>
		</HashRouter>
	)
}


export let ConfirmSuccess: Story = () => {
	return (
		<HashRouter>
			<div className="vulpo-auth vulpo-auth-container">
				<div className="vulpo-auth-box-shadow">
					<Confirm
						loading={false}
						error={null}
					/>
				</div>
			</div>
		</HashRouter>
	)
}

