import React from 'react'

import { Story, Meta } from '@storybook/react/types-6-0'
import { action } from '@storybook/addon-actions'
import { HashRouter } from 'react-router-dom'

import { AuthConfig, DefaultConfig } from 'context/config'
import { Translation, DefaultTranslation } from 'context/translation'
import { EnterEmail } from 'passwordless/enter_email'
import { CheckEmail } from 'passwordless/check'
import { Confirm } from 'passwordless/confirm'
import { Container } from 'component/layout'
import { BoxShadow } from 'component/card'
import { ErrorCode } from '@riezler/auth-sdk'

export default {
	title: 'Passwordless',
} as Meta

export let Enter: Story = () => {
	return (
		<HashRouter>
			<Container>
				<BoxShadow>
					<EnterEmail
						loading={false}
						error={null}
						onBack={action('onBack')}
						onSignIn={action('onSignIn')}
						ctx='signin'
					/>
				</BoxShadow>
			</Container>
		</HashRouter>
	)
}

Enter.storyName = 'Enter Email'

export let Check: Story = () => {
	return (	
		<Container>
			<BoxShadow>
				<CheckEmail
					email='michael@riezler.co'
					type='signin'
				/>
			</BoxShadow>
		</Container>
	)
}

Check.storyName = 'Check Email'

export let ConfirmAuth: Story = () => {
	return (
		<HashRouter>		
			<Container>
				<BoxShadow>
					<Confirm
						loading
						error={null}
					/>
				</BoxShadow>
			</Container>
		</HashRouter>
	)
}

export let ConfirmError: Story = () => {
	return (
		<HashRouter>
			<Container>
				<BoxShadow>
					<Confirm
						loading={false}
						error={ErrorCode.GenericError}
					/>
				</BoxShadow>
			</Container>
		</HashRouter>
	)
}


export let ConfirmSuccess: Story = () => {
	return (
		<HashRouter>
			<Container>
				<BoxShadow>
					<Confirm
						loading={false}
						error={null}
					/>
				</BoxShadow>
			</Container>
		</HashRouter>
	)
}

