import styled from 'styled-components'
import { IconButton } from '@biotic-ui/button'

export let Card = styled.div`
	background: var(--card-background, #fff);
	inline-size: 25rem;
	max-inline-size: 98vw;
	border-radius: var(--baseline);
	box-shadow: var(--shadow-4);
	padding: var(--baseline-3);
	display: flex;
	flex-direction: column;
	transition: height 0.50s ease 0.2s;
`

export let CardHeader = styled.header`
	margin-block-end: calc(var(--baseline) * 2.375);
`

export let CardTitle = styled.h3`
	margin-block-end: 0;
`

export let CardNav = styled.nav`
	display: flex;
	align-items: center;
	margin-block-end: calc(var(--baseline) * 1.5);
	margin-block-start: calc(var(--baseline) * -0.25);

	${IconButton} {
		margin-inline-end: var(--baseline);
	}

	label {
		margin: 0;
	}
`