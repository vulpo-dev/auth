import React from 'react'
import { Switch, Route } from 'react-router-dom'

import EnterEmail from 'passwordless/enter_email'
import Confirm from 'passwordless/confirm'
import CheckEmail from 'passwordless/check'

let Passwordless = () => {
	return (
		<Switch>
			<Route path='/:type/link/check-email'>
				<CheckEmail />
			</Route>

			<Route path='/:type/link/confirm'>
				<Confirm />
			</Route>

			<Route path='/:type/link'>
				<EnterEmail />
			</Route>
		</Switch>
	)
}

export default Passwordless