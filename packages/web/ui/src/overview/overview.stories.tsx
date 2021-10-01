import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'

import { HashRouter, Switch, Route, Redirect } from 'react-router-dom'
import { Overview } from 'overview'
import { Container } from 'component/layout'
import { BoxShadow } from 'component/card'
import { Translation, DefaultTranslation } from 'context/translation'
import { FlagsCtx } from 'context/config'
import { Flag } from '@riezler/auth-sdk'

export default {
	title: 'Overview',
	component: Overview,
	argTypes: {
	  flags: {
	  	defaultValue: [
  			Flag.SignIn,
  			Flag.SignUp,
  		],
	  	control: {
	  		type: 'multi-select',
	  		options: [
	  			Flag.SignIn,
	  			Flag.SignUp,
	  		]
	  	}
	  }
	},
} as Meta

let Template: Story<{ flags: Array<Flag> }> = ({ flags }) => {
	return (
		<FlagsCtx.Provider value={flags}>	
			<Translation.Provider value={DefaultTranslation}>
				<HashRouter>
					<Switch>

						<Route path='/:type'>
							<Container>
								<BoxShadow>
									<Overview />
								</BoxShadow>
							</Container>
						</Route>

						<Redirect to='/signin' from='/' />
					</Switch>
				</HashRouter>
			</Translation.Provider>
		</FlagsCtx.Provider>
	)
}

export let Default = Template.bind({})