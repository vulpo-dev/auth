import styled from 'styled-components'

import { CardTitle } from 'component/card'

export let Label = styled.label`
	margin-block-start: -2px;
	margin-block-end: calc(var(--baseline) * 0.25);
	display: inline-block;
`

export let Error = styled.p`
	text-align: center;
	color: var(--red);
	margin-block-end: 0;
`


export let Title = styled(CardTitle)`
	margin-block-end: calc(var(--baseline) * 0.625);
`

export let Subtitle = styled.p`
	margin-block-end: 0;
`