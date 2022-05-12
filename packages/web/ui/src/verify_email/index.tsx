import React, { Fragment, useState, useEffect } from 'react'
import { ErrorCode, Flag } from '@riezler/auth-sdk'
import { useAuth } from '@riezler/auth-react'
import { useLocation, Navigate } from 'react-router-dom'

import { useQueryParams } from '../utils'
import { Flow } from '../component/loading'
import CheckIcon from '../component/check'
import { useTranslation, useError } from '../context/translation'
import { useConfig, useFlags } from '../context/config'
import Card from '../component/card'

export type Props = {
	loading: boolean;
	error: ErrorCode | null;
}

export let VerifyEmail = ({ loading, error }: Props) => {
	let t = useTranslation()
	let errorMessage = useError(error)

	return (
		<Card className="vulpo-auth-verify-email">
			<header className="vulpo-card-header">
				<h3 className="vulpo-auth-card-title">{t.verify_email.title}</h3>
			</header>

			{ (loading && error === null) &&
				<div className="vulpo-auth-loading-wrapper">
					<Flow />
				</div>
			}

			{ (!loading && error === null) &&
				<Fragment>
					<div className="vulpo-auth-loading-wrapper">
						<CheckIcon />
					</div>
					<p className="vulpo-auth-verify-email-text">{t.verify_email.success}</p>
				</Fragment>
			}

			{ error !== null &&
				<p className="vulpo-auth-error">{errorMessage}</p>
			}
		</Card>
	)
}

let VerifyEmailContainer = () => {
	let auth = useAuth()
	let location = useLocation()
	let query = useQueryParams(location.search)
	let { basename } = useConfig()

	let [error, setError] = useState<ErrorCode | null>(null)
	let [loading, setLoading] = useState<boolean>(false)

	useEffect(() => {
		let id = query.get('id')
		let token = query.get('token')

		if (!id || !token) {
			setError(ErrorCode.TokenNotFound)
			return
		}

		let sink = Promise.all([
			wait(2000),
			auth.verifyEmail(id, token)
		])
		
		sink.then(() => setLoading(false))
			.catch(err => {
				setLoading(false)
				setError(err.code)
			})

	}, [])

	let flags = useFlags()
	if (!flags.includes(Flag.VerifyEmail)) {
		return <Navigate to={basename} />
	}

	return (
		<VerifyEmail loading={loading} error={error} />
	)
}

export default VerifyEmailContainer

function wait(time: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, time)
	})
}
