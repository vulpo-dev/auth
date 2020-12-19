import styled from 'styled-components'

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