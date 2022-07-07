import { useEffect, useState } from 'react'
import { useLocation, useMatch } from 'react-router-dom'
import { useAuth } from '@vulpo-dev/auth-react'
import { ErrorCode, ApiError } from '@vulpo-dev/auth-sdk'

import { useQueryParams } from '../utils'
import { useTranslation } from '../context/translation'
import { useConfig } from '../context/config'
import Card from '../component/card'

export type Props = {
	email: string | null;
	type: 'signin' | 'signup';
}

export let CheckEmail = ({ email }: Props) => {
	let t = useTranslation()

	return (
		<Card className="vulpo-auth-passwordless-check">
			<header className="vulpo-card-header">
				<h3 className="vulpo-auth-card-title test-check-email">{t.passwordless_check.title}</h3>
			</header>

			<p>
				<strong>{t.passwordless_check.warning}</strong>
			</p>

			<t.passwordless_check.description email={email} type={t.signin.label} />
			<small>{t.passwordless_check.info}</small>
		</Card>
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

		let controller = new AbortController();
		auth.verifyPasswordless(id, session, { signal: controller.signal })
			.catch((err: ApiError) => {
				if (err.code !== ErrorCode.AbortError) {
					setError(err.code)
				}
			})

		return () => {
			controller.abort()
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
