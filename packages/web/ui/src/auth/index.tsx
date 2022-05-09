import React from 'react'
import { useEffect, useState, Fragment } from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import { useAuth } from '@riezler/auth-react'
import { Flag, ErrorCode } from '@riezler/auth-sdk'
import Axios from 'axios'

import { Flow } from '../component/loading'
import Overview from '../overview'
import Password from '../password'
import PasswordReset from '../password_reset'
import Passwordless from '../passwordless'
import VerifyEmail from '../verify_email'
import { useTranslation, useError } from '../context/translation'
import { FlagsCtx, useConfig } from '../context/config'
import SetPassword from '../user/set_password'
import OAuthConfirm from '../oauth'

let Auth = () => {
	let auth = useAuth()
	let t = useTranslation()
	let [flags, setFlags] = useState<Array<Flag> | undefined>()
	let [error, setError] = useState<ErrorCode | null>(null)
	let errorMessage = useError(error)
	let { Router } = useConfig()

	useEffect(() => {
		let source = Axios.CancelToken.source()
		auth.flags({ cancelToken: source.token })
			.then((flags: Array<Flag>) => setFlags(flags))
			.catch((err) => {
				if (!Axios.isCancel(err)) {
					setError(err.code)
				}
			})

		return () => {
			source.cancel()
		}
	}, [auth])

	if (flags === undefined) {
		return (
			<div className="vulpo-auth vulpo-auth-card vulpo-auth-card--center">
				<Flow />
			</div>
		)
	}

	if (error !== null) {
		return (
			<div className="vulpo-auth vulpo-auth-card vulpo-auth-card--center">
				<p className="vulpo-auth-error">{errorMessage}</p>
			</div>
		)
	}

	if (
		!flags.includes(Flag.SignIn) &&
		!flags.includes(Flag.SignUp)
	) {
		return (
			<div className="vulpo-auth vulpo-auth-card vulpo-auth-card--center">
				<p className="vulpo-auth-error">{t.error.not_allowed}</p>
			</div>
		)
	}

	let withOverview = showOverview(flags)

	let children = (
		<Switch>
			<Route path='/user/set_password'>
				<SetPassword />
			</Route>

			<Route path='/oauth/confirm'>
				<OAuthConfirm />
			</Route>

			{ flags.includes(Flag.VerifyEmail) &&
				<Route path='/verify-email'>
					<VerifyEmail /> 
				</Route>
			}
			
			{ flags.includes(Flag.PasswordReset) &&
				<Route path='/forgot-password'>
					<PasswordReset />
				</Route>
			}

			{ flags.includes(Flag.EmailAndPassword) &&
				<Route path='/:type/email'>
					<Password />
				</Route>
			}

			{ flags.includes(Flag.AuthenticationLink) &&
				<Route path='/:type/link'>
					<Passwordless />
				</Route>
			}

			{ withOverview &&
				<Fragment>
					<Route path='/:type'>
						<Overview />
					</Route>

					<Redirect to={getRedirect(flags)} from='/' />
				</Fragment>
			}

			{ !withOverview &&
				<Redirect to={getMethodRedirect(flags)} />
			}

		</Switch>
	)

	return (
		<FlagsCtx.Provider value={flags}>
			{ React.cloneElement(Router, { children })}
		</FlagsCtx.Provider>
	)
}

export default Auth

function showOverview(flags: Array<Flag>): boolean {
	return flags.includes(Flag.AuthenticationLink) && flags.includes(Flag.EmailAndPassword)
}

function getMethodRedirect(flags: Array<Flag>): string {
	let type = flags.includes(Flag.SignIn)
		? 'signin'
		: flags.includes(Flag.SignUp)
		? 'signup'
		: ''

	let method = flags.includes(Flag.EmailAndPassword)
		? 'email'
		: flags.includes(Flag.AuthenticationLink) 
		? 'link'
		: ''

	return `/${type}/${method}`
}

function getRedirect(flags: Array<Flag>): string {
	return flags.includes(Flag.SignIn)
		? '/signin'
		: '/signup'
}