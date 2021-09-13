import React from 'react'
import { useEffect, useState, Fragment } from 'react'
import styled from 'styled-components'
import { HashRouter, Switch, Route, Redirect } from 'react-router-dom'

import Overview from 'overview'
import Password from 'password'
import PasswordReset from 'password_reset'
import Passwordless from 'passwordless'
import VerifyEmail from 'verify_email'
import { useAuth } from '@riezler/auth-react'
import { Flag, ApiError, ErrorCode } from '@riezler/auth-sdk'
import { Flow } from '@biotic-ui/leptons'
import { Card } from 'component/card'
import Axios from 'axios'
import { Error } from 'component/text'
import { useTranslation, useError } from 'context/translation'
import { FlagsCtx } from 'context/config'
import SetPassword from 'user/set_password'

let Auth = () => {
	let auth = useAuth()
	let t = useTranslation()
	let [flags, setFlags] = useState<Array<Flag> | undefined>()
	let [error, setError] = useState<ErrorCode | null>(null)
	let errorMessage = useError(error)

	useEffect(() => {
		let source = Axios.CancelToken.source()
		auth.flags({ cancelToken: source.token })
			.then((flags: Array<Flag>) => setFlags(flags))
			.catch((err: ApiError) => {
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
			<StyledCard>
				<Flow />
			</StyledCard>
		)
	}

	if (error !== null) {
		return (
			<StyledCard>
				<Error>{errorMessage}</Error>
			</StyledCard>
		)
	}

	if (
		!flags.includes(Flag.SignIn) &&
		!flags.includes(Flag.SignUp)
	) {
		return (
			<StyledCard>
				<Error>{t.error.not_allowed}</Error>
			</StyledCard>
		)
	}

	let withOverview = showOverview(flags)

	return (
		<FlagsCtx.Provider value={flags}>
			<HashRouter>
				<Switch>
					<Route path='/user/set_password'>
						<SetPassword />
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
			</HashRouter>
		</FlagsCtx.Provider>
	)
}

export default Auth

let StyledCard = styled(Card)`
	display: flex;
	justify-content: center;
	align-items: center;
	height: calc(var(--baseline) * 26);
`

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