import React from 'react'
import { useMemo } from 'react'
import styled from 'styled-components'
import { Card } from 'component/card'
import { OutlineButton, Button } from '@biotic-ui/button'
import Header from 'component/header'
import { Link, useLocation, Redirect } from 'react-router-dom'
import { useTranslation } from 'context/translation'
import { useFlags } from 'context/config'
import { Flag } from '@riezler/auth-sdk'

export let Overview = () => {
	let t = useTranslation()
	let { pathname } = useLocation()
	let flags = useFlags()
	let redirect = useMemo<string | null>(() => {

		if (pathname.startsWith('/signin') && !flags.includes(Flag.SignIn)) {
			return 'signup'
		}

		if (pathname.startsWith('/signup') && !flags.includes(Flag.SignUp)) {
			return 'signin'
		}

		if (!flags.includes(Flag.SignIn) && !flags.includes(Flag.SignUp)) {
			return ''
		}

		return null

	}, [pathname, flags])

	if (redirect !== null) {
		return <Redirect to={`/${redirect}`} />
	}

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

export default Overview


// using any here because ts complains about "forwardedAs"
let LinkButton = styled<any>(Button)`
	margin-block-end: var(--baseline);
	block-size: var(--baseline-4);
`

// using any here because ts complains about "forwardedAs"
let StyledOutline = styled<any>(OutlineButton)`
	block-size: var(--baseline-4);
`