import styled from 'styled-components'
import { IconButton } from '@biotic-ui/button'
import { BASELINE, CARD_BACKGROUND, SHADOW, WithClass, withClass } from '../utils'

export let BoxShadow = styled.div
	.attrs<WithClass>(withClass('vulpo-auth-box-shadow'))`
		--vulpo-auth-shadow--default: ${SHADOW};
		box-shadow: var(--vulpo-auth-shadow, var(--vulpo-auth-shadow--default));	
	`

export let Card = styled.div
	.attrs<WithClass>(withClass('vulpo-auth-card'))`
		background: ${CARD_BACKGROUND};
		inline-size: 25rem;
		max-inline-size: 98vw;
		border-radius: ${BASELINE};
		padding: calc(${BASELINE} * 3);
		display: flex;
		flex-direction: column;
		transition: height 0.50s ease 0.2s;
		--loading-size: calc(${BASELINE} * 5);
		--shadow-2: ${SHADOW};
	`

export let CardHeader = styled.header
	.attrs<WithClass>(withClass('vulpo-card-header'))`
		margin-block-end: calc(${BASELINE} * 2.375);
	`

export let CardTitle = styled.h3
	.attrs<WithClass>(withClass('vulpo-auth-card-title'))`
		margin-block-end: 0;
	`

export let CardNav = styled.nav
	.attrs<WithClass>(withClass('vulpo-auth-card-nav'))`
		display: flex;
		align-items: center;
		margin-block-end: calc(${BASELINE} * 1.5);
		margin-block-start: calc(${BASELINE} * -0.25);

		${IconButton} {
			margin-inline-end: ${BASELINE};
		}

		label {
			margin: 0;
		}
	`