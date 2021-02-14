import React from 'react'
import { HashRouter, Switch, Route, Redirect } from 'react-router-dom'

import { Container } from 'component/layout'
import Overview from 'overview'
import Password from 'password'
import PasswordReset from 'password_reset'
import Passwordless from 'passwordless'

let Auth = () => {
	return (
		<HashRouter>
			<Switch>

				<Route path='/forgot-password'>
					<PasswordReset />
				</Route>

				<Route path='/:type/email'>
					<Password />
				</Route>

				<Route path='/:type/link'>
					<Passwordless />
				</Route>

				<Route path='/:type'>
					<Overview />
				</Route>

				<Redirect to='/signin' from='/' />
			</Switch>
		</HashRouter>
	)
}

export default Auth
