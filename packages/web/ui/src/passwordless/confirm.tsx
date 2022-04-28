import React from 'react'
import { FunctionComponent, Fragment, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Flow } from '@biotic-ui/leptons'
import { useQueryParams } from '@biotic-ui/std'
import { ErrorCode } from '@riezler/auth-sdk'
import { useAuth } from '@riezler/auth-react'

import { useTranslation, useError } from '../context/translation'

type Props = {
	loading: boolean;
	error: null | ErrorCode;
}

export let Confirm: FunctionComponent<Props> = ({ loading, error }) => {
	let t = useTranslation()
	let errorMessage = useError(error)

	let Overview = <Link className="vulpo-auth-passwordless-confirm-overview" to='/'>Overview</Link>

	return (
		<div className="vulpo-auth vulpo-auth-card vulpo-auth-passwordless-confirm">
			<header className="vulpo-card-header">
				<h3 className="vulpo-auth-card-title test-confirm-signin">Confirm Sign In</h3>
			</header>

			{ loading &&
				<div className="vulpo-auth-passwordless-confirm-loading">
					<Flow />
				</div>
			}

			{ error &&
				<Fragment>
					<p className="vulpo-auth-error">{errorMessage}</p>
					{ Overview }
				</Fragment>
			}

			{ (!error && !loading) &&
				<Fragment>
					<span>Your sign in has been confirmed.</span>
					<strong>You can now close this window.</strong>
					{ Overview }
				</Fragment>
			}

		</div>
	)
}

let ConfirmContainer = () => {
	let auth = useAuth()
	let location = useLocation()
	let query = useQueryParams(location.search)

	let [error, setError] = useState<ErrorCode | null>(null)
	let [loading, setLoading] = useState<boolean>(false)

	useEffect(() => {
		let id = query.get('id')
		let token = query.get('token')

		if (!id || !token) {
			setError(ErrorCode.PasswordlessInvalidToken)
			return
		}

		let sink = Promise.all([
			wait(2000),
			auth.confirmPasswordless(id, token)
		])
		
		sink.then(() => setLoading(false))
			.catch(err => {
				setLoading(false)
				setError(err.code)
			})
	}, [])

	return <Confirm loading={loading} error={error} />
}

export default ConfirmContainer

function wait(time: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, time)
	})
}
