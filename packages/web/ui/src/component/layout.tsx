import styled from 'styled-components'

export let Container = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	inline-size: 100%;
	block-size: 100%;
`

export let Section = styled.section`
	margin-block-end: var(--baseline-2);
	display: flex;
	flex-direction: column;
`

export let Footer = styled.footer`
	text-align: center;
`

export let Divider = styled.hr`
	border: 0;
	height: 1px;
	width: 100%;
	margin-block-start: var(--baseline);
	margin-block-end: calc(var(--baseline) * 1.625);
	background: var(--border-color);
`

export let LoadingWrapper = styled.div`
	display: flex;
	justify-content: center;
`
