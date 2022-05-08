import React from 'react'
import App from './App'
import { Route } from 'react-router-dom'
import { AuthShell } from '@riezler/auth-ui'
import '@riezler/auth-ui/styles.css'

let Bootstrap = () => {
	return (
		<AuthShell>
			<Route path='/page'>
				<Page />
			</Route>

			<Route path='/'>
				<App />
			</Route>
		</AuthShell>
	)
}

export default Bootstrap

function Page() {
	return (
		<h1>Page</h1>
	)
}