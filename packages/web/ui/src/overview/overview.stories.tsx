import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'

import { HashRouter, Switch, Route, Redirect } from 'react-router-dom'
import { Overview } from 'overview'
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
							<div className="vulpo-auth vulpo-auth-container">
								<div className="vulpo-auth-box-shadow">
									<Overview />
								</div>
							</div>
						</Route>

						<Redirect to='/signin' from='/' />
					</Switch>
				</HashRouter>
			</Translation.Provider>
		</FlagsCtx.Provider>
	)
}

export let Default = Template.bind({})