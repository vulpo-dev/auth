import React from 'react'

import { Story, Meta } from '@storybook/react/types-6-0'
import { action } from '@storybook/addon-actions'

import { AuthConfig, DefaultConfig } from 'context/config'
import { Translation, DefaultTranslation } from 'context/translation'
import { EnterEmail } from 'passwordless/enter_email'
import { CheckEmail } from 'passwordless/check'
import { Container } from 'component/layout'

export default {
	title: 'Passwordless',
} as Meta

export let Enter: Story = () => {
	return (
		<Container>
			<EnterEmail
				loading={false}
				error={null}
				onBack={action('onBack')}
				onSignIn={action('onSignIn')}
			/>
		</Container>
	)
}

Enter.storyName = 'Enter Email'

export let Check: Story = () => {
	return (
		<Container>
			<CheckEmail
				email='michael@riezler.co'
			/>
		</Container>
	)
}

Check.storyName = 'Check Email'