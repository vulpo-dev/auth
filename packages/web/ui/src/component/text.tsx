import styled from 'styled-components'

import { CardTitle } from '../component/card'
import { BASELINE, ERROR, WithClass, withClass } from '../utils'

export let Label = styled.label
	.attrs<WithClass>(withClass('vulpo-auth-label'))`
		margin-block-start: -2px;
		margin-block-end: calc(${BASELINE} * 0.25);
		display: inline-block;
	`

export let Error = styled.p
	.attrs<WithClass>(withClass('vulpo-auth-error'))`
		text-align: center;
		color: ${ERROR};
		margin-block-end: 0;
	`


export let Title = styled(CardTitle)
	.attrs<WithClass>(withClass('vulpo-auth-title'))`
		margin-block-end: calc(${BASELINE} * 0.625);
	`

export let Subtitle = styled.p
	.attrs<WithClass>(withClass('vulpo-auth-subtitle'))`
		margin-block-end: 0;
	`