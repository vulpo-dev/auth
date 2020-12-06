import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'

import { HashRouter, Switch, Route, Redirect } from 'react-router-dom'
import { Overview } from 'overview'
import { Container } from 'component/layout'
import { Translation, DefaultTranslation } from 'context/translation'

export default {
	title: 'Overview',
	component: Overview,
	argTypes: {},
} as Meta

let Template: Story<{}> = args => {
	return (
		<Translation.Provider value={DefaultTranslation}>
			<HashRouter>
				<Switch>

					<Route path='/:type'>
						<Container>
							<Overview />
						</Container>
					</Route>

					<Redirect to='/signin' from='/' />
				</Switch>
			</HashRouter>
		</Translation.Provider>
	)
}

export let Default = Template.bind({})