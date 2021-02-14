import React from 'react'
import { Switch, Route } from 'react-router-dom'

import EnterEmail from 'passwordless/enter_email'


let Passwordless = () => {
	return (
		<Switch>
			<Route path='/:type/link'>
				<EnterEmail />
			</Route>
		</Switch>
	)
}

export default Passwordless