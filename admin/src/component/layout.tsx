import styled from 'styled-components'

export let Main = styled.main`
	padding-top: var(--baseline-5);
	height: 100%;
`

export let Header = styled.header`
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	background: var(--color-header);
	height: var(--baseline-5);
	padding: 0 var(--baseline-3);
	display: flex;
	align-items: center;

	h1 {
		font-size: var(--baseline-3);
		margin-bottom: 0;
	}
`

export let Container = styled.div`
	max-width: 1000px;
	width: 100%;
	margin: 0 auto;
`