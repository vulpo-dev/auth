import styled from 'styled-components'
import { IconButton } from '@biotic-ui/button'

export let Card = styled.div`
	background: var(--card-background, #fff);
	width: calc(var(--baseline) * 50);
	min-height: calc(var(--baseline) * 30);
	border-radius: var(--baseline);
	box-shadow: var(--shadow-4);
	padding: var(--baseline-2);
	display: flex;
	flex-direction: column;
	transition: height 0.50s ease 0.2s;
`

export let CardHeader = styled.header`
	margin-bottom: var(--baseline-2);

	${IconButton} {
		margin-right: var(--baseline);
	}
`

export let CardTitle = styled.h3`
	margin-bottom: 0;
`

export let CardNav = styled.nav`
	display: flex;
	align-items: center;
	margin-bottom: var(--baseline);
`