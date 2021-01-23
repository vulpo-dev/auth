import React from 'react'
import { Fragment, FC } from 'react'
import styled from 'styled-components'
import { Flow } from '@biotic-ui/leptons'
import { Header } from 'component/layout'
import ContentLoader from 'react-content-loader'

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

type GhostBarProps = {
	width?: string | number;
	height?: string | number;
}

export let GhostBar: FC<GhostBarProps> = ({ width = '100%', height = '100%' }) => (
	<ContentLoader
		backgroundColor="#f3f3f322"
		foregroundColor="#ecebeb22"
		width={width}
		height={height}>
		<rect x="0" y="0" rx="0" ry="0" width="100%" height="100%" />
	</ContentLoader>
)