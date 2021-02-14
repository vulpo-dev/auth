import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'

import Auth from 'auth'
import { Container } from 'component/layout'

export default {
	title: 'Auth',
	component: Auth,
	argTypes: {},
} as Meta

let Template: Story<{}> = args => {
	return (
		<Container>
			<Auth />
		</Container>
	)
}

export let Default = Template.bind({})