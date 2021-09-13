import React from 'react'
import { FunctionComponent, Fragment, useState, useEffect } from 'react'
import styled from 'styled-components'
import { Link, useLocation } from 'react-router-dom'
import { Flow } from '@biotic-ui/leptons'
import { useQueryParams } from '@biotic-ui/std'
import { ErrorCode } from '@riezler/auth-sdk'
import { useAuth } from '@riezler/auth-react'

import { Card, CardHeader, CardTitle } from '../component/card'
import { useTranslation, useError } from '../context/translation'
import { Error } from '../component/text'

type Props = {
	loading: boolean;
	error: null | ErrorCode;
}

export let Confirm: FunctionComponent<Props> = ({ loading, error }) => {
	let t = useTranslation()
	let errorMessage = useError(error)

	return (
		<Card>
			<CardHeader>
				<Title>Confirm Sign In</Title>
			</CardHeader>

			{ loading &&
				<LoadingWrapper>
					<StyledFlow />
				</LoadingWrapper>
			}

			{ error &&
				<Fragment>
					<Error>{errorMessage}</Error>
					<Overview to='/'>Overview</Overview>
				</Fragment>
			}

			{ (!error && !loading) &&
				<Fragment>
					<span>Your sign in has been confirmed.</span>
					<strong>You can now close this window.</strong>
					<Overview to='/'>Overview</Overview>
				</Fragment>
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

let Title = styled(CardTitle)`
	line-height: 1;
	margin-block-start: calc(var(--baseline) * -0.375);
`

let LoadingWrapper = styled.div`
	display: flex;
	justify-content: center;
`

let StyledFlow = styled(Flow)`
	align-items: center;
`

let Overview = styled(Link)`
	margin-block-start: var(--baseline);
	text-align: center;
	color: currentColor;
`

function wait(time: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, time)
	})
}
