import { HashRouter } from 'react-router-dom'

import {
	DefaultConfig,
	AuthConfig,
	DefaultTranslation,
	Translation,
	Password
} from '@riezler/auth-ui'

export let Auth = () => {
	return (
		<AuthConfig.Provider value={DefaultConfig}>
			<Translation.Provider value={DefaultTranslation}>
				<Password />	
			</Translation.Provider>
		</AuthConfig.Provider>
	)
}

export default Auth