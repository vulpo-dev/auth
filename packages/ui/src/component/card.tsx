import styled from 'styled-components'
import { IconButton } from '@biotic-ui/button'

export let Card = styled.div`
	background: var(--card-background, #fff);
	width: 25rem;
	max-width: 98vw;
	min-height: calc(var(--baseline) * 25);
	border-radius: var(--baseline);
	box-shadow: var(--shadow-4);
	padding: var(--baseline-3);
	display: flex;
	flex-direction: column;
	transition: height 0.50s ease 0.2s;
`

export let CardHeader = styled.header`
	margin-bottom: calc(var(--baseline) * 2.375);
`

export let CardTitle = styled.h3`
	margin-bottom: 0;
`

export let CardNav = styled.nav`
	display: flex;
	align-items: center;
	margin-bottom: calc(var(--baseline) * 1.5);
	margin-top: calc(var(--baseline) * -0.25);

	${IconButton} {
		margin-right: var(--baseline);
	}
`