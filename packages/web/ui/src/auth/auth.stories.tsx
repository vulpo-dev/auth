import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'

import Auth from 'auth'
import { Container } from 'component/layout'
import { BoxShadow } from 'component/card'

import { Auth as AuthCtx } from '@riezler/auth-react'
import { Auth as AuthClient } from '@riezler/auth-sdk'

let auth = AuthClient.create({
	project: 'ae16cc4a-33be-4b4e-a408-e67018fe453b',
	baseURL: 'http://127.0.0.1:8000',
})

export default {
	title: 'Auth',
	component: Auth,
	argTypes: {},
} as Meta

let Template: Story<{}> = args => {
	return (
		<AuthCtx.Provider value={auth}>
			<Container>
				<BoxShadow>
					<Auth />
				</BoxShadow>
			</Container>
		</AuthCtx.Provider>
	)
}

export let Default = Template.bind({})