import { useCallback, FunctionComponent, Fragment, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ErrorCode } from '@vulpo-dev/auth-sdk'
import { useAuth } from '@vulpo-dev/auth-react'

import { Flow } from '../component/loading'
import { useQueryParams } from '../utils'
import { useTranslation, useError } from '../context/translation'
import Card from '../component/card'
import { Button } from '../component/button'

type Props = {
	loading: boolean;
	error: null | ErrorCode;
	authenticated: boolean;
	onSignIn: () => void;
}

export let Confirm: FunctionComponent<Props> = ({ loading, error, authenticated, onSignIn }) => {
	let t = useTranslation()
	let errorMessage = useError(error)

	let Overview = <Link className="vulpo-auth-passwordless-confirm-overview" to='/'>Overview</Link>

	return (
		<Card className="vulpo-auth-passwordless-confirm">
			<header className="vulpo-card-header">
				<h3 className="vulpo-auth-card-title">
					{ t.passwordless_confirm.title }
				</h3>
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

			{ (!error && !loading && authenticated) &&
				<Fragment>
					<span className='test-confirm-success'>{ t.passwordless_confirm.success }</span>
					<strong>{ t.passwordless_confirm.info }</strong>
					{ Overview }
				</Fragment>
			}

			{ (!error && !loading && !authenticated) &&
				<div className='vulpo-auth-passwordless-confirm-signin test-confirm-signin'>
					<Button onClick={onSignIn}>
						{ t.signin.label }
					</Button>
				</div>
			}

		</Card>
	)
}

let ConfirmContainer = () => {
	let auth = useAuth()
	let location = useLocation()
	let query = useQueryParams(location.search)

	let [error, setError] = useState<ErrorCode | null>(null)
	let [loading, setLoading] = useState<boolean>(false)
	let [authenticated, setAuthenticated] = useState<boolean>(false)

	let signIn = useCallback(() => {
		let id = query.get('id')
		let token = query.get('token')

		if (!id || !token) {
			setError(ErrorCode.PasswordlessInvalidToken)
			return
		}

		setLoading(true)

		let sink = Promise.all([
			wait(2000),
			auth.confirmPasswordless(id, token)
		])
		
		sink.then(() => setAuthenticated(true))
			.catch(err => setError(err.code))
			.finally(() => setLoading(false))
	}, [query])

	return <Confirm
		loading={loading}
		error={error}
		authenticated={authenticated}
		onSignIn={signIn}
	/>
}

export default ConfirmContainer

function wait(time: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, time)
	})
}
