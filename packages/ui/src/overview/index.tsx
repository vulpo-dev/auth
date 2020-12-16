import React from 'react'
import styled from 'styled-components'
import { Card } from 'component/card'
import { OutlineButton, Button } from '@biotic-ui/button'
import Header from 'component/header'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'context/translation'

export let Overview = () => {
	let t = useTranslation()
	let { pathname } = useLocation()

	return (
		<Card>
			<Header />
			<LinkButton forwardedAs={Link} to={`${pathname}/link`}>
				{t.email.label}
			</LinkButton>
			<StyledOutline forwardedAs={Link} to={`${pathname}/email`}>
				{t.password.label}
			</StyledOutline>
		</Card>
	)
}

let LinkButton = styled(Button)`
	margin-bottom: var(--baseline);
	height: var(--baseline-4);
`

let StyledOutline = styled(OutlineButton)`
	height: var(--baseline-4);
`