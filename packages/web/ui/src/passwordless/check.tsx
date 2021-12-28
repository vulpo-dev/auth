import React from 'react'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useQueryParams } from '@biotic-ui/std'
import { useLocation, useRouteMatch } from 'react-router-dom'
import { useAuth } from '@riezler/auth-react'
import { ErrorCode, CancelToken } from '@riezler/auth-sdk'

import { Card, CardHeader, CardTitle } from '../component/card'
import { useTranslation } from '../context/translation'
import { BASELINE } from 'utils'

export type Props = {
	email: string | null;
	type: 'signin' | 'signup';
}

export let CheckEmail = ({ email }: Props) => {
	let t = useTranslation()

	return (
		<Card className="vulpo-auth-passwordless-check">
			<Header>
				<Title className="test-check-email">{t.passwordless_check.title}</Title>
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
	margin-block-start: calc(${BASELINE} * -0.375);
`

let Header = styled(CardHeader)`
	margin-block-end: calc(${BASELINE} * 2.75);
`