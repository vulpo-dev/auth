import styled from 'styled-components'

export let Card = styled.div`
	background: var(--card-background, #fff);
	width: calc(var(--baseline) * 50);
	min-height: calc(var(--baseline) * 30);
	border-radius: var(--baseline);
	box-shadow: var(--shadow-4);
	padding: var(--baseline-2);
	display: flex;
	flex-direction: column;
`