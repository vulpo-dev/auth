import React from 'react'
import { useMemo } from 'react'
import { OutlineButton, Button } from '@biotic-ui/button'
import { Link, useLocation, Redirect } from 'react-router-dom'
import { Flag } from '@riezler/auth-sdk'

import Header from '../component/header'
import { useTranslation } from '../context/translation'
import { useFlags } from '../context/config'

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
		<div className="vulpo-auth vulpo-auth-card vulpo-auth-overview">
			<Header />
			<Link className="vulpo-auth-link-button" to={`${pathname}/link`}>
				<Button>
					{t.email.label}
				</Button>
			</Link>
			<Link className="vulpo-auth-password-button" to={`${pathname}/email`}>
				<OutlineButton>
					{t.password.label}
				</OutlineButton>
			</Link>
		</div>
	)
}

export default Overview
