import styled from "@emotion/styled";
import { Button } from "werkbank/component/button";

export { Button } from "werkbank/component/button";

export let WarnButton = styled(Button)`
	--button-bg: var(--color-warn);
	--button-bg--hover: var(--color-warn--light);
	font-weight: bold;
`;
