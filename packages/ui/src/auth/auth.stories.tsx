import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'

import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import Auth from 'auth'
import { Container } from 'component/layout'
import { BoxShadow } from 'component/card'

import { Auth as AuthCtx } from '@riezler/auth-react'
import { Auth as AuthClient } from '@riezler/auth-sdk'


let mock = new MockAdapter(axios);

let auth = AuthClient.create({
	project: 'ae16cc4a-33be-4b4e-a408-e67018fe453b',
	baseURL: 'http://127.0.0.1:8000',
	http: axios,
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


// todo: define mocks
mock.onPost('/password/sign_in').reply(200, {})
mock.onPost('/password/sign_up').reply(200, {})
mock.onPost('user/sign_out/:session').reply(200, {})
mock.onPost('user/sign_out_all/:session').reply(200, {})
mock.onPost('/password/request_password_reset').reply(200, {})
mock.onPost('/password/password_reset').reply(200, {})
mock.onPost('/password/verify_reset_token').reply(200, {})
mock.onPost('/passwordless/confirm').reply(200, {})
mock.onPost('/passwordless/verify').reply(200, {})
mock.onPost('/user/verify_email').reply(200, {})