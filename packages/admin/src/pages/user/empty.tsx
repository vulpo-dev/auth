import styled from "@emotion/styled";

let StyledEmptyUser = styled.div`
	display: flex;
	justify-content: center;
	padding-top: var(--size-5);
`;

let EmptyUser = () => {
	return (
		<StyledEmptyUser>
			<h3>No user selected</h3>
		</StyledEmptyUser>
	);
};

export default EmptyUser;
