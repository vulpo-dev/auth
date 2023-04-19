import {
	Textarea,
	Section as InputSection,
	Label,
	Input,
} from "werkbank/component/form";

import { Header, Section } from "./layout";
import { useGetPublicKeysQuery } from "../../../data/admin_api";
import styled from "@emotion/styled";

type Props = {
	project: string;
};

let PublicKeysSettings = ({ project }: Props) => {
	let keys = useGetPublicKeysQuery([project]);

	if (keys.data === undefined) {
		return null;
	}

	return (
		<Section key={project}>
			<form>
				<Header>
					<h2>Public Keys</h2>
				</Header>
				{keys.data.map((key) => (
					<InputSection key={key.id}>
						<Label>Key ID</Label>
						<StyledInput defaultValue={key.id} readOnly />
						<Textarea minRows={9} value={key.key} readOnly />
					</InputSection>
				))}
			</form>
		</Section>
	);
};

export default PublicKeysSettings;

let StyledInput = styled(Input)`
	margin-block-end: var(--size-2);
`;
