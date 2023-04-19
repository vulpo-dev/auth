import styled from "@emotion/styled";

export let Header = styled.header`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: var(--size-3);

	h2 {
		margin-bottom: 0;
	}
`;

export let Section = styled.section`
	border-radius: var(--size-2);
	background: var(--color-background--dark);
	padding: var(--size-5);
	max-width: var(--container-width);
	margin-bottom: var(--size-5);
	width: 100%;
`;
