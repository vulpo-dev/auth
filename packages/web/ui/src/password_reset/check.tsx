import React from 'react'
import styled from 'styled-components'
import { useQueryParams } from '@biotic-ui/std'
import { useLocation } from 'react-router-dom'

import { Card, CardHeader, CardNav, CardTitle } from '../component/card'
import { useTranslation } from '../context/translation'

export type Props = {
	email: string | null;
}

export let CheckReset = ({ email }: Props) => {
	let t = useTranslation()

	return (
		<Card>
			<Header>
				<Title>{t.reset_check_mail.title}</Title>
			</Header>
			<t.reset_check_mail.description email={email} />
			<small>{t.reset_check_mail.info}</small>
		</Card>
	)
}

let CheckResetContainer = () => {
	let location = useLocation()
	let params = useQueryParams(location.search)

	return (
		<CheckReset email={params.get('email')} />
	)
}

export default CheckResetContainer

let Title = styled(CardTitle)`
	line-height: 1;
	margin-block-start: calc(var(--baseline) * -0.375);
`

let Header = styled(CardHeader)`
	margin-block-end: calc(var(--baseline) * 2.75);
`