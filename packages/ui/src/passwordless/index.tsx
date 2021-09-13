import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import { Flag } from '@riezler/auth-sdk'

import { useFlags } from '../context/config'

import EnterEmail from './enter_email'
import Confirm from './confirm'
import CheckEmail from './check'

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