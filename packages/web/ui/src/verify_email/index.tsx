import { Fragment, useState, useCallback } from 'react'
import { ErrorCode, Flag } from '@vulpo-dev/auth-sdk'
import { useAuth } from '@vulpo-dev/auth-react'
import { Navigate } from 'react-router-dom'

import { useQueryParams } from '../utils'
import { Flow } from '../component/loading'
import CheckIcon from '../component/check'
import { useTranslation, useError } from '../context/translation'
import { useConfig, useFlags } from '../context/config'
import Card from '../component/card'
import { Button } from '../component/button'

export type Props = {
	loading: boolean;
	error: ErrorCode | null;
	onVerify: () => void;
	verified: boolean;
}

export let VerifyEmail = ({ loading, error, onVerify, verified }: Props) => {
	let t = useTranslation()
	let errorMessage = useError(error)

	return (
		<Card className="vulpo-auth-verify-email">
			<header className="vulpo-card-header">
				<h3 className="vulpo-auth-card-title">{t.verify_email.title}</h3>
			</header>

			{ (!loading && !error && !verified) &&
				<div className='vulpo-auth-verify-email-confirm'>
					<Button onClick={onVerify}>
						{ t.verify_email.label }
					</Button>
				</div>
			}

			{ (loading && error === null) &&
				<div className="vulpo-auth-loading-wrapper">
					<Flow />
				</div>
			}

			{ (!loading && !error && verified) &&
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
	let query = useQueryParams()
	let { basename } = useConfig()

	let [error, setError] = useState<ErrorCode | null>(null)
	let [loading, setLoading] = useState<boolean>(false)
	let [verified, setVerified] = useState<boolean>(false)

	let verify = useCallback(() => {
		let id = query.get('id')
		let token = query.get('token')

		if (!id || !token) {
			setError(ErrorCode.TokenNotFound)
			return
		}

		setLoading(true)

		let sink = Promise.all([
			wait(2000),
			auth.verifyEmail(id, token)
		])
		
		sink.then(() => setVerified(true))
			.catch(err => setError(err.code))
			.finally(() => setLoading(false))

	}, [query])

	let flags = useFlags()
	if (!flags.includes(Flag.VerifyEmail)) {
		return <Navigate to={basename} />
	}

	return (
		<VerifyEmail
			verified={verified}
			loading={loading}
			error={error}
			onVerify={verify}
		/>
	)
}

export default VerifyEmailContainer

function wait(time: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, time)
	})
}
