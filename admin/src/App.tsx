import { Switch, Route } from 'react-router-dom'

import Setup from 'setup'
import Dashboard from 'dashboard'
import Auth from 'auth'

export default function App() {
	return (
		<Switch>
			<Route path='/setup'>
				<Setup />
			</Route>

			<Route path='/auth'>
				<Auth />
			</Route>

			<Route path='/'>
				<Dashboard />
			</Route>

		</Switch>
	)
}