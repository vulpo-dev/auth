import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@vulpo-dev/auth-react'

import { useTranslation } from '../context/translation'
import { useQueryParams } from '../utils'
import { Flow } from '../component/loading'

let ConfirmOAuth = () => {
	let location = useLocation()
	let query = useQueryParams(location.search)
	let t = useTranslation()
	let auth = useAuth()

	let csrf_token = query.get('state')
	let code = query.get('code')

	useEffect(() => {
		if (csrf_token === null || code === null) {
			return
		}

		auth.oAuthConfirm(csrf_token, code).then(res => {
			console.log({ res })
		})
	}, [csrf_token, code, auth])

	if (csrf_token === null || code === null) {
		return (
			<div className='vulpo-auth-card vulpo-auth-oauth-confirm'>
				<p className="vulpo-auth-error">
					{ t.error.generic }
				</p>
			</div>
		)
	}


	return (
		<div className='vulpo-auth-card vulpo-auth-oauth-confirm'>
			<Flow />
		</div>
	)
}

export default ConfirmOAuth