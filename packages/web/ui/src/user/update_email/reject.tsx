import { ErrorCode } from "@vulpo-dev/auth-sdk"
import { FormEvent, Fragment, useCallback, useState } from "react"

import { Button } from "../../component/button"
import Card from "../../component/card"
import { Flow } from "../../component/loading"
import { useError, useTranslation } from "../../context/translation"
import CheckIcon from '../../component/check'
import { useQueryParams } from "../../utils"
import { useAuth } from "@vulpo-dev/auth-react"

export type RejectProps = {
	loading: boolean;
	error: ErrorCode | null;
	onSubmit: () => void;
	submitted: boolean;
}

export let Reject = ({
	loading = true,
	error = null,
	onSubmit,
	submitted = false,
}: RejectProps) => {
	let t = useTranslation()
	let errorMessage = useError(error)

	let ok = (!loading && error === null)

	let handleSubmit = (e: FormEvent) => {
		e.preventDefault()
		onSubmit()
	}

	return (
		<Card className="vulpo-auth-user-email-reject">
			<header className="vulpo-card-header">
				<h3 className="vulpo-auth-card-title">{t.update_email_reject.title}</h3>
			</header>

			{ (loading && error === null) &&
				<div className="vulpo-auth-loading-wrapper">
					<Flow />
				</div>
			}

			{ error !== null &&
				<p className="vulpo-auth-error">{errorMessage}</p>
			}

			{ (ok && !submitted) &&
				<form className="vulpo-auth-button-form" onSubmit={handleSubmit}>
					<Button>
						{ t.update_email_reject.label }
					</Button>
				</form>
			}

			{ (ok && submitted) &&
				<Fragment>
					<div className="vulpo-auth-loading-wrapper">
						<CheckIcon />
					</div>
					<p className="vulpo-auth-text-success">
						{ t.update_email_reject.submitted }
					</p>
				</Fragment>
			}
		</Card>
	)
}

let RejectContainer = () => {
	let auth = useAuth()
	let params = useQueryParams()

	let [loading, setLoading] = useState(false)
	let [submitted, setSubmitted] = useState(false)
	let [error, setError] = useState<ErrorCode | null>(null)

	let handleSubmit = useCallback(() => {
		let id = params.get('id')
		let token = params.get('token')

		if (!id || !token) {
			return setError(ErrorCode.InvalidArguments)
		}

		setLoading(true)

		auth.rejectUpdateEmail(id, token)
			.then(() => setSubmitted(true))
			.catch((err) => setError(err.code))
			.finally(() => setLoading(false))
	}, [auth])

	return <Reject
		onSubmit={handleSubmit}
		loading={loading}
		error={error}
		submitted={submitted}
	/>
}

export default RejectContainer
