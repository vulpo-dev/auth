import { useEffect, useState, Fragment } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@vulpo-dev/auth-react'
import { Flag, ErrorCode, ApiError } from '@vulpo-dev/auth-sdk'

import { Flow } from '../component/loading'
import Overview from '../overview'
import Password from '../password'
import PasswordReset from '../password_reset'
import Passwordless from '../passwordless'
import VerifyEmail from '../verify_email'
import { useTranslation, useError } from '../context/translation'
import { FlagsCtx } from '../context/config'
import SetPassword from '../user/set_password'
import OAuthConfirm from '../oauth'

let Auth = () => {
	let auth = useAuth()
	let t = useTranslation()
	let [flags, setFlags] = useState<Array<Flag> | undefined>()
	let [error, setError] = useState<ErrorCode | null>(null)
	let errorMessage = useError(error)

	useEffect(() => {
		let controller = new AbortController();

		auth.flags({ signal: controller.signal })
			.then((flags: Array<Flag>) => setFlags(flags))
			.catch((err: ApiError) => {
				if (err.code !== ErrorCode.AbortError) {
					setError(err.code)
				}
			})

		return () => {
			controller.abort()
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

	return (
		<FlagsCtx.Provider value={flags}>
			<Routes>
				<Route path={`user/set_password/*`} element={<SetPassword />} />
				<Route path={`oauth/confirm/*`} element={<OAuthConfirm />} />

				{ flags.includes(Flag.VerifyEmail) &&
					<Route path={`verify-email/*`} element={<VerifyEmail /> } />
				}
				
				{ flags.includes(Flag.PasswordReset) &&
					<Route path={`forgot-password/*`} element={<PasswordReset />} />
				}

				{ flags.includes(Flag.EmailAndPassword) &&
					<Fragment>
						<Route path={`signin/email/*`} element={<Password />} />
						<Route path={`signup/email/*`} element={<Password />} />
					</Fragment>
				}

				{ flags.includes(Flag.AuthenticationLink) &&
					<Fragment>
						<Route path={`signin/link/*`} element={<Passwordless />} />
						<Route path={`signup/link/*`} element={<Passwordless />} />
					</Fragment>
				}

				{ withOverview &&
					<Fragment>
						<Route path={'signup/*'} element={<Overview />} />
						<Route path={'signin/*'} element={<Overview />} />
						<Route path='/*' element={<Navigate to={getRedirect(flags)} />} />
					</Fragment>
				}

				{ !withOverview &&
					<Route path='/*' element={<Navigate to={getMethodRedirect(flags)} />} />
				}

			</Routes>
		</FlagsCtx.Provider>
	)
}

export default Auth

function showOverview(flags: Array<Flag>): boolean {
	return flags.includes(Flag.OAuthGoogle) || (flags.includes(Flag.AuthenticationLink) && flags.includes(Flag.EmailAndPassword))
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

	return `${type}/${method}`
}

function getRedirect(flags: Array<Flag>): string {
	return flags.includes(Flag.SignIn)
		? 'signin'
		: 'signup'
}
