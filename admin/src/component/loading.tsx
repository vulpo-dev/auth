import { Fragment } from 'react'
import styled from 'styled-components'
import { Flow } from '@biotic-ui/leptons'
import { Header } from 'component/layout'

let Wrapper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;
	color: var(--color-header);
`

export let PageLoad = () => {
	return (
		<Fragment>
			<Header>
				<h1>Authentication</h1>
			</Header>
			<Wrapper>
				<Flow />
			</Wrapper>
		</Fragment>
	)
}

export let GhostPage = () => (
	<Fragment>
		<Header>
			<h1>Authentication</h1>
		</Header>
	</Fragment>
)