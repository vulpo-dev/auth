import React from 'react'
import { useMemo } from 'react'
import styled from 'styled-components'
import { OutlineButton, Button } from '@biotic-ui/button'
import { Link, useLocation, Redirect } from 'react-router-dom'
import { Flag } from '@riezler/auth-sdk'

import { Card } from '../component/card'
import Header from '../component/header'
import { useTranslation } from '../context/translation'
import { useFlags } from '../context/config'
import { BASELINE } from 'utils'

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
		<Card className="vulpo-auth-overview">
			<Header />
			<LinkButton className="vulpo-auth-link-button" forwardedAs={Link} to={`${pathname}/link`}>
				{t.email.label}
			</LinkButton>
			<StyledOutline className="vulpo-auth-password-button" forwardedAs={Link} to={`${pathname}/email`}>
				{t.password.label}
			</StyledOutline>
		</Card>
	)
}

export default Overview


// using any here because ts complains about "forwardedAs"
let LinkButton = styled<any>(Button)`
	margin-block-end: ${BASELINE};
	block-size: calc(${BASELINE} * 4);
`

// using any here because ts complains about "forwardedAs"
let StyledOutline = styled<any>(OutlineButton)`
	block-size: calc(${BASELINE} * 4);
`