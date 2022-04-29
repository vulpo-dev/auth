import AuthExample from './auth_example'
import { AuthConfig, DefaultConfig } from '@riezler/auth-ui'

function AuthExamplePage() {
	return (
		<AuthConfig.Provider value={{ ...DefaultConfig, basename: '/ui' }}>
			<AuthExample />
		</AuthConfig.Provider>
	)
}

export default AuthExamplePage
