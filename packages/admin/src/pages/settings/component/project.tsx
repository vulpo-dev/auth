import { FormEvent } from "react";
import { Project, ProjectSettings } from "@vulpo-dev/auth-sdk-admin";

import { Input, Label, Section as InputSection } from "werkbank/component/form";
import { Button } from "werkbank/component/button";

import { Header, Section } from "./layout";
import { useSetProjectMutation } from "../../../data/admin_api";

type ProjectSettingsProps = {
	project: Project;
};

let ProjectSettings = ({ project }: ProjectSettingsProps) => {
	let [save, saveResult] = useSetProjectMutation();

	function handleSubmit(e: FormEvent) {
		e.preventDefault();

		let data = new FormData(e.target as HTMLFormElement);

		let updatedProject: ProjectSettings = {
			domain: `${data.get("domain") ?? ""}`,
			project: project.id,
			name: `${data.get("name") ?? ""}`,
		};

		save([updatedProject]);
		// TODO: success toast
	}

	return (
		<Section>
			<form key={project.id} onSubmit={handleSubmit}>
				<Header>
					<h2>Project</h2>

					<Button loading={saveResult.isLoading}>Save</Button>
				</Header>
				<InputSection>
					<Label>Project ID:</Label>
					<Input defaultValue={project.id} readOnly />
				</InputSection>

				<InputSection>
					<Label htmlFor="project-name">Name:</Label>
					<Input id="project-name" name='name' defaultValue={project.name} />
				</InputSection>

				<InputSection>
					<Label htmlFor="project-domain">Domain:</Label>
					<Input
						id="project-domain"
						name='domain'
						type='url'
						defaultValue={project.domain}
					/>
				</InputSection>
			</form>
		</Section>
	);
};

export default ProjectSettings;
