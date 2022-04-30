import AuthExample from './auth_example'
import { AuthConfig, DefaultConfig } from '@riezler/auth-ui'
import { MemoryRouter } from 'react-router'

function AuthWithMemoryRouter() {
	return (
		<MemoryRouter>
			<AuthConfig.Provider value={{ ...DefaultConfig, Router: <MemoryRouter />, basename: '/ui' }}>
				<AuthExample />
			</AuthConfig.Provider>
		</MemoryRouter>
	)
}

export default AuthWithMemoryRouter
