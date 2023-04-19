import styled from "@emotion/styled";

import { TopBar } from "werkbank/component/layout";

export let PageWrapper = styled(TopBar.Container)``;
export let PageContent = styled(TopBar.Content)``;

export let PageHeader = styled(TopBar.Header)`
	border-bottom: var(--border);
	background: var(--color-background--dark);
`;

export let PageTitle = styled.h1`
	margin: 0;
	font-size: var(--size-4);
	display: flex;
	gap: var(--size-2);
	align-items: center;
`;
