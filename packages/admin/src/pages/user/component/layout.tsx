import styled from "@emotion/styled";

export let Container = styled.div`
	width: 100%;
	border-radius: var(--size-2);
	background: var(--color-background--dark);
	padding: var(--size-5);
	max-width: var(--container-width);
	margin-bottom: var(--size-5);
`;

export let Header = styled.header`
	display: flex;
	justify-content: space-between;
	align-items: baseline;
`;

export let Actions = styled.section`
	display: flex;
	gap: var(--size-2);
`;
