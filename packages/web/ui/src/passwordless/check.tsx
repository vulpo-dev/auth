import React from 'react'
import { useEffect, useState } from 'react'
import { useLocation, useMatch } from 'react-router-dom'
import { useAuth } from '@riezler/auth-react'
import { ErrorCode, CancelToken } from '@riezler/auth-sdk'

import { useQueryParams } from '../utils'
import { useTranslation } from '../context/translation'
import { useConfig } from 'context/config'

export type Props = {
	email: string | null;
	type: 'signin' | 'signup';
}

export let CheckEmail = ({ email }: Props) => {
	let t = useTranslation()

	return (
		<div className="vulpo-auth vulpo-auth-card vulpo-auth-passwordless-check">
			<header className="vulpo-card-header">
				<h3 className="vulpo-auth-card-title test-check-email">{t.passwordless_check.title}</h3>
			</header>

			<p>
				<strong>{t.passwordless_check.warning}</strong>
			</p>

			<t.passwordless_check.description email={email} type={t.signin.label} />
			<small>{t.passwordless_check.info}</small>
		</div>
	)
}

let CheckEmailContainer = () => {
	let auth = useAuth()
	let location = useLocation()
	let query = useQueryParams(location.search)
	let { basename } = useConfig()
	let match = useMatch(`${basename}/:type/*`)
	let [_, setError] = useState<ErrorCode | null>(null)

	useEffect(() => {
		let id = query.get('id')
		let session = query.get('session')

		if (!id || !session) {
			setError(ErrorCode.PasswordlessInvalidToken)
			return
		}

		let source = CancelToken.source()
		auth.verifyPasswordless(id, session, { cancelToken: source.token })
			.catch((err) => setError(err.code))

		return () => {
			source.cancel()
		}
	}, [])


	let type = match?.params.type as 'signin' | 'signup' | undefined
	return (
		<CheckEmail
			email={query.get('email')}
			type={type ?? 'signin'}
		/>
	)
}

export default CheckEmailContainer
