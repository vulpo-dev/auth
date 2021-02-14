import React from 'react'
import App from './App'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import { useAuthStateChange } from '@riezler/auth-react'
import { UserState } from '@riezler/auth-sdk'

let Bootstrap = () => {

	useAuthStateChange((user: UserState) => {
		console.log(user)
	})

	return (
		<BrowserRouter>
			<Switch>
				<Route path='/'>
					<App />
				</Route>
			</Switch>
		</BrowserRouter>
	)
}

export default Bootstrap