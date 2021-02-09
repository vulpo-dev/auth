import styled from 'styled-components'

export let Header = styled.header`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: var(--baseline-2);

	h2 {
		margin-bottom: 0;
	}
`

export let Section = styled.section`
	margin-bottom: calc(var(--baseline) * 12);
`