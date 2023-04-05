import { FormEvent } from "react";
import styled from "@emotion/styled";

import { Section, Input, Label } from "werkbank/component/form";
import { Button } from "werkbank/component/button";
import { useCreateProjectMutation } from "../data/admin_api";

type CreateProjectProps = {
	onCreate: (projectId: string) => void;
};

let CreateProject = ({ onCreate }: CreateProjectProps) => {
	let [create, result] = useCreateProjectMutation();

	let handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		let target = e.target as HTMLFormElement;
		let data = new FormData(target);

		let payload = {
			name: `${data.get("name") ?? ""}`,
			domain: `${data.get("domain") ?? ""}`,
		};

		let res = await create([payload]);

		if ("data" in res) {
			let projectId = res.data[0];
			onCreate(projectId);
		}
	};

	return (
		<Wrapper>
			<header>
				<h2>Create Project</h2>
			</header>
			<form onSubmit={handleSubmit}>
				<Section>
					<Label htmlFor="project">Project Name:</Label>
					<Input type="text" name="name" id="name" required />
				</Section>
				<Section>
					<Label>Project Domain:</Label>
					<Input
						type="url"
						name="domain"
						id="domain"
						placeholder="https://"
						required
					/>
				</Section>
				<ButtonSection>
					<Button loading={result.isLoading}>Create Project</Button>
				</ButtonSection>
			</form>
		</Wrapper>
	);
};

export default CreateProject;

let Wrapper = styled.div`
	--input-bg: rgba(200, 200, 200, 0.3);
	--input-border: 1px solid #000;
	--input-color: #000;

	color: #000;
`;

let ButtonSection = styled(Section)`
	display: flex;
	justify-content: flex-end;
`;
