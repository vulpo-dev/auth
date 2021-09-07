import React from 'react'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useCreateProject } from 'data/admin'
import { useHistory } from 'react-router-dom'
import { Flow } from '@biotic-ui/leptons'
import { ErrorMessage } from '@biotic-ui/text'

const MIN_TIMEOUT = 5000 // 5s

export type Props = {
	error: boolean;
}

export let Project = ({ error }: Props) => {
	return (
		<Wrapper>
			<h2>Creating Admin Project</h2>
			<ContentWrapper>
				{ !error &&
					<React.Fragment>
						<Flow />
					</React.Fragment>
				}
				{ error &&
					<ErrorMessage>Something went wrong</ErrorMessage>
				}
			</ContentWrapper>

		</Wrapper>
	)
}

let ProjectContainer = () => {
	let history = useHistory()
	let [ready, setReady] = useState(false)
	let { id, error } = useCreateProject()

	useEffect(() => {
		let id = setTimeout(() => {
			setReady(true)
		}, MIN_TIMEOUT)

		return () => {
			clearTimeout(id)
		}

	}, [setReady])

	useEffect(() => {
		if (id && ready) {
			history.replace('/setup/user')
		}
	}, [id, history, ready])

	return <Project error={error} />
}

export default ProjectContainer

let Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
`

let ContentWrapper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	flex-grow: 1;
`