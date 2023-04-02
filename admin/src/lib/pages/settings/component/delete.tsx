import { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Input, Section as FormSection, Label } from "werkbank/component/form";
import { Header, Section } from "./layout";
import { WarnButton } from "../../../component/button";
import { Project } from "../../../admin_sdk";
import { useDeleteProjectMutation } from "../../../data/admin_api";

type Props = {
	project: Project;
};

let DeleteProject = ({ project }: Props) => {
	let navigate = useNavigate();
	let [deleteProject, deleteProjectResult] = useDeleteProjectMutation();

	async function submit(e: FormEvent) {
		e.preventDefault();

		await deleteProject([project.id]);
		navigate("/", { replace: true });
	}

	return (
		<Section>
			<form onSubmit={submit}>
				<Header>
					<h2>Delete Project</h2>

					<WarnButton loading={deleteProjectResult.isLoading}>
						Delete
					</WarnButton>
				</Header>

				<FormSection>
					<p>Enter the project name before you can delete the project.</p>
				</FormSection>

				<FormSection>
					<Label>Project Name:</Label>
					<Input
						name="name"
						pattern={project.name}
						required
						autoComplete="off"
					/>
				</FormSection>
			</form>
		</Section>
	);
};

export default DeleteProject;
