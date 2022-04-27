import AuthExample from './auth_example'
import { AuthConfig, DefaultConfig } from '@riezler/auth-ui'
import { MemoryRouter } from 'react-router'

function AuthWithMemoryRouter() {
	return (
		<AuthConfig.Provider value={{ ...DefaultConfig, Router: <MemoryRouter /> }}>
			<AuthExample />
		</AuthConfig.Provider>
	)
}

export default AuthWithMemoryRouter
