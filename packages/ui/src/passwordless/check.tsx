import React from 'react'
import styled from 'styled-components'
import { Card, CardHeader, CardNav, CardTitle } from 'component/card'
import { useTranslation } from 'context/translation'
import { useQueryParams } from '@biotic-ui/std'
import { useLocation } from 'react-router-dom'

export type Props = {
	email: string | null;
}

export let CheckEmail = ({ email }: Props) => {
	let t = useTranslation()

	return (
		<Card>
			<Header>
				<Title>{t.passwordless_check.title}</Title>
			</Header>

			<p><strong>Do not close this window until opening the email link.</strong></p>

			<t.passwordless_check.description email={email} type='Sign In' />
			<small>{t.passwordless_check.info}</small>
		</Card>
	)
}

let CheckEmailContainer = () => {
	let location = useLocation()
	let params = useQueryParams(location.search)

	return (
		<CheckEmail email={params.get('email')} />
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