import styled from 'styled-components'

export let FormWrapper = styled.div`
	max-width: 800px;
	width: 100%;
	margin: 0 auto;
	padding-top: var(--baseline-3);
`

export let FormHeader = styled.header`
	display: flex;
	justify-content: flex-end;
	margin-bottom: var(--baseline-3);

	button {
		margin-left: var(--baseline);
	}
`