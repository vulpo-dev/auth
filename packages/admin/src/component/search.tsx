import styled from "@emotion/styled";
import { FormEventHandler } from "react";
import { useOnEscape } from "werkbank";
import { Input } from "werkbank/component/form";
import { X } from "@phosphor-icons/react";
import { IconButton } from "werkbank/component/button";

type SearchProps = {
	onCancel: () => void;
	onSearch: (search: string) => void;
};

let Search = ({ onCancel, onSearch }: SearchProps) => {
	useOnEscape(() => {
		onCancel();
	});

	let handleSearch: FormEventHandler = (e) => {
		e.preventDefault();
		let data = new FormData(e.target as HTMLFormElement);
		let search = data.get("search");

		if (!search) {
			return;
		}

		onSearch(search.toString());
	};

	return (
		<Form onSubmit={handleSearch}>
			<StyledInput autoFocus type="search" name="search" />
			<StyledIconButton type="button" onClick={onCancel}>
				<X />
			</StyledIconButton>
		</Form>
	);
};

export default Search;

let Form = styled.form`
	width: 100%;
	position: relative;
	display: flex;
	align-items: center;
`;

let StyledInput = styled(Input)`
	padding-right: var(--size-4);
`;

let StyledIconButton = styled(IconButton)`
	position: absolute;
	right: var(--size-1);
`;
