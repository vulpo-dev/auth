import AuthExample from './auth_example'
import { AuthConfig, DefaultConfig } from '@vulpo-dev/auth-ui'
import { MemoryRouter } from 'react-router-dom'

function AuthWithMemoryRouter() {
	return (
		<MemoryRouter>
			<AuthConfig.Provider value={{ ...DefaultConfig, basename: 'ui' }}>
				<AuthExample />
			</AuthConfig.Provider>
		</MemoryRouter>
	)
}

export default AuthWithMemoryRouter
