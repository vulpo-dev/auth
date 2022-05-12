import App from './App'
import { Route, Link } from 'react-router-dom'
import { AuthShell } from '@riezler/auth-ui'

let Bootstrap = () => {
	return (
		<AuthShell name="VULPO" dark>
			<Route path='/page' element={<Page />} />
			<Route path='/' element={<App />} />
		</AuthShell>
	)
}

export default Bootstrap

function Page() {
	return (
		<div>
			<h1>Page</h1>
			<Link to="/">App</Link>
		</div>
	)
}