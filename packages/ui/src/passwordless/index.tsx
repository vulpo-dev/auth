import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import { useFlags } from 'context/config'

import EnterEmail from 'passwordless/enter_email'
import Confirm from 'passwordless/confirm'
import CheckEmail from 'passwordless/check'
import { Flag } from '@riezler/auth-sdk'

let Passwordless = () => {
	let flags = useFlags()

	if (!flags.includes(Flag.AuthenticationLink)) {
		return <Redirect to='/' />
	}
	
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