import React from 'react'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Card, CardHeader, CardNav, CardTitle } from 'component/card'
import { useTranslation } from 'context/translation'
import { useQueryParams } from '@biotic-ui/std'
import { useLocation, useRouteMatch } from 'react-router-dom'
import { useAuth } from '@riezler/auth-react'
import { ErrorCode, ApiError, CancelToken } from '@riezler/auth-sdk'

export type Props = {
	email: string | null;
	type: 'signin' | 'signup';
}

export let CheckEmail = ({ email }: Props) => {
	let t = useTranslation()

	return (
		<Card>
			<Header>
				<Title>{t.passwordless_check.title}</Title>
			</Header>

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
	let match = useRouteMatch<{ type: 'signin' | 'signup' }>('/:type')
	let [error, setError] = useState<ErrorCode | null>(null)

	useEffect(() => {
		let id = query.get('id')

		if (!id) {
			setError(ErrorCode.PasswordlessInvalidToken)
			return
		}

		let source = CancelToken.source()
		auth.verifyPasswordless(id, { cancelToken: source.token })
			.catch((err: ApiError) => setError(err.code))

		return () => {
			source.cancel()
		}
	}, [])

	return (
		<CheckEmail
			email={query.get('email')}
			type={match?.params.type ?? 'signin'}
		/>
	)
}

export default CheckEmailContainer

let Title = styled(CardTitle)`
	line-height: 1;
	margin-block-start: calc(var(--baseline) * -0.375);
`

let Header = styled(CardHeader)`
	margin-block-end: calc(var(--baseline) * 2.75);
`