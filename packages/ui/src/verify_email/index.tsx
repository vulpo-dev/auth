import React, { Fragment, useState, useEffect } from 'react'
import styled from 'styled-components'
import { Card, CardHeader, CardTitle } from 'component/card'
import { Flow } from '@biotic-ui/leptons'
import { ErrorCode } from '@riezler/auth-sdk'
import { LoadingWrapper } from 'component/layout'
import CheckIcon from 'component/check'
import { Error } from 'component/text'
import { useTranslation, useError } from 'context/translation'
import { useAuth } from '@riezler/auth-react'
import { useLocation } from 'react-router-dom'
import { useQueryParams } from '@biotic-ui/std'

export type Props = {
	loading: boolean;
	error: ErrorCode | null;
}

export let VerifyEmail = ({ loading, error }: Props) => {
	let t = useTranslation()
	let errorMessage = useError(error)

	return (
		<Card>
			<CardHeader>
				<Title>{t.verify_email.title}</Title>
			</CardHeader>

			{ (loading && error === null) &&
				<LoadingWrapper>
					<Flow />
				</LoadingWrapper>
			}

			{ (!loading && error === null) &&
				<Fragment>
					<LoadingWrapper>
						<CheckIcon />
					</LoadingWrapper>
					<Text>{t.verify_email.success}</Text>
				</Fragment>
			}

			{ error !== null &&
				<Error>{errorMessage}</Error>
			}
		</Card>
	)
}

let VerifyEmailContainer = () => {
	let auth = useAuth()
	let location = useLocation()
	let query = useQueryParams(location.search)

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

	return (
		<VerifyEmail loading={loading} error={error} />
	)
}

export default VerifyEmailContainer

let Title = styled(CardTitle)`
	line-height: 1;
	margin-block-start: calc(var(--baseline) * -0.375);
`

let Text = styled.p`
	margin-block-start: var(--baseline-2);
	margin-block-end: 0;
	text-align: center;
`

function wait(time: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, time)
	})
}
