import styled from "@emotion/styled";
import { HTMLAttributes } from "react";
import { X } from "@phosphor-icons/react";

import { IconButton } from "werkbank/component/button/button";
import { Section, Input, Label, ChipsInput } from "werkbank/component/form";
import { User } from "../../../admin_sdk";

let StyledLabel = styled(Label)`
	margin-block-end: var(--size-1);
	display: inline-block;
`;

let StyledChipsInput = styled(ChipsInput)`
	background: var(--input-bg);
	border: var(--input-border);

	input {
		color: var(--color-copy);
	}
`;

let Chip = styled.span<{ $focus: boolean }>`
	padding: var(--size-1) var(--size-3);
	padding-right: var(--size-2);
	border: 1px solid;
	color: var(--color-copy);
	border-radius: var(--size-2);
	border-color: var(${(p) => (p.$focus ? "--color-error" : "--color-copy")});
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;

	display: flex;
	column-gap: var(--size-2);
`;

type FormProps = Omit<HTMLAttributes<HTMLFormElement>, "defaultValue">;

export type Props = FormProps & {
	defaultValue?: User;
};

export let UserForm = ({ defaultValue, ...props }: Props) => {
	return (
		<form {...props}>
			<Section>
				<StyledLabel htmlFor="email">Email address</StyledLabel>
				<Input
					id='email'
					type='email'
					name='email'
					defaultValue={defaultValue?.email ?? ""}
				/>
			</Section>

			<Section>
				<Label>User Id</Label>
				<Input defaultValue={defaultValue?.id ?? ""} readOnly />
			</Section>

			<Section>
				<Label htmlFor="display_name">Display Name:</Label>
				<Input
					id="display_name"
					name='display_name'
					defaultValue={defaultValue?.display_name ?? ""}
				/>
			</Section>
			<Section>
				<Label htmlFor="traits">Traits:</Label>
				<StyledChipsInput
					id="traits"
					name="traits"
					defaultValue={defaultValue?.traits.join(",")}
					render={({ value, isFocus, onDelete }) => (
						<Chip key={value} $focus={isFocus}>
							{value}
							<IconButton onClick={onDelete}>
								<X size={20} />
							</IconButton>
						</Chip>
					)}
				/>
			</Section>
		</form>
	);
};
