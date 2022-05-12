import React from 'react'
import { useMemo } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { Flag } from '@riezler/auth-sdk'
import { useAuth } from '@riezler/auth-react'

import { Button } from '../component/button'
import Header from '../component/header'
import { useTranslation } from '../context/translation'
import GoogleAuthIcon from '../component/google_auth_icon'
import { useConfig, useFlags } from '../context/config'
import Card from '../component/card'

export let Overview = () => {
	let t = useTranslation()
	let auth = useAuth()
	let { basename } = useConfig()

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
		return <Navigate to={`${basename}/${redirect}`} />
	}

	let disabled = auth.singInWithRedirect.loading

	return (
		<Card className="vulpo-auth-overview">
			<Header />

			<div className="vulpo-auth-overview-buttons">
				{ flags.includes(Flag.AuthenticationLink) &&
					<Link className="vulpo-auth-link-button" to={`${pathname}/link`}>
						<Button disabled={disabled}>
							{t.email.label}
						</Button>
					</Link>
				}

				{ flags.includes(Flag.EmailAndPassword) &&
					<Link className="vulpo-auth-password-button" to={`${pathname}/email`}>
						<Button outline disabled={disabled}>
							{t.password.label}
						</Button>
					</Link>
				}

				{ flags.includes(Flag.OAuthGoogle) &&
					<Button className="vulpo-auth-oauth-google" loading={auth.singInWithRedirect.loading} onClick={() => auth.singInWithRedirect('google')}>
						<GoogleAuthIcon />
						<span>{t.google.label}</span>
					</Button>
				}
			</div>
		</Card>
	)
}

export default Overview