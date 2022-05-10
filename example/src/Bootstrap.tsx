import App from './App'
import { Route } from 'react-router-dom'
import { AuthShell } from '@riezler/auth-ui'
import '@riezler/auth-ui/styles.css'

let Bootstrap = () => {
	return (
		<AuthShell>
			<Route path='/page' element={<Page />} />
			<Route path='/' element={<App />} />
		</AuthShell>
	)
}

export default Bootstrap

function Page() {
	return (
		<h1>Page</h1>
	)
}