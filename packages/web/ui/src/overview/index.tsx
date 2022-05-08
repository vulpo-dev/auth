import React from 'react'
import { useMemo } from 'react'
import { OutlineButton, Button } from '@biotic-ui/button'
import { Link, useLocation, Redirect } from 'react-router-dom'
import { Flag } from '@riezler/auth-sdk'

import Header from '../component/header'
import { useTranslation } from '../context/translation'
import GoogleAuthIcon from '../component/google_auth_icon'
import { useFlags } from '../context/config'
import { useAuth } from '@riezler/auth-react'

export let Overview = () => {
	let t = useTranslation()
	let auth = useAuth()

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

	let disabled = auth.singInWithRedirect.loading

	return (
		<div className="vulpo-auth vulpo-auth-card vulpo-auth-overview">
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
						<OutlineButton disabled={disabled}>
							{t.password.label}
						</OutlineButton>
					</Link>
				}

				{ flags.includes(Flag.OAuthGoogle) &&
					<Button className="vulpo-auth-oauth-google" loading={auth.singInWithRedirect.loading} onClick={() => auth.singInWithRedirect('google')}>
						<GoogleAuthIcon />
						<span>{t.google.label}</span>
					</Button>
				}
			</div>
		</div>
	)
}

export default Overview