import { Routes, Route, Navigate } from 'react-router-dom'
import { Flag } from '@vulpo-dev/auth-sdk'

import { useConfig, useFlags } from '../context/config'

import EnterEmail from './enter_email'
import Confirm from './confirm'
import CheckEmail from './check'

let Passwordless = () => {
	let flags = useFlags()
	let { basename } = useConfig()

	if (!flags.includes(Flag.AuthenticationLink)) {
		return <Navigate to={basename} />
	}
	
	return (
		<Routes>
			<Route path='check-email' element={<CheckEmail />} />
			<Route path='confirm' element={<Confirm />} />
			<Route path='/' element={<EnterEmail />} />
		</Routes>
	)
}

export default Passwordless