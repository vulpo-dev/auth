import AuthExample from './auth_example'
import { AuthConfig, DefaultConfig } from '@vulpo-dev/auth-ui'
import { BrowserRouter } from 'react-router-dom'

function AuthExamplePage() {
	return (
		<BrowserRouter>
			<AuthConfig.Provider value={{ ...DefaultConfig, basename: 'ui/auth' }}>
				<AuthExample />
			</AuthConfig.Provider>
		</BrowserRouter>
	)
}

export default AuthExamplePage
