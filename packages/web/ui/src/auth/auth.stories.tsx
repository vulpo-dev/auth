import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { Auth as AuthCtx } from '@vulpo-dev/auth-react'
import { Auth as AuthClient } from '@vulpo-dev/auth-sdk'

import Auth from '../auth'

let auth = AuthClient.create({
	project: 'ae16cc4a-33be-4b4e-a408-e67018fe453b',
	baseURL: 'http://127.0.0.1:8000',
})

export default {
	title: 'Auth',
	component: Auth,
	argTypes: {},
} as Meta

let Template: Story<{}> = () => {
	return (
		<AuthCtx.Provider value={auth}>
			<div className="vulpo-auth vulpo-auth-container">
				<div className="vulpo-auth-box-shadow">
					<Auth />
				</div>
			</div>
		</AuthCtx.Provider>
	)
}

export let Default = Template.bind({})