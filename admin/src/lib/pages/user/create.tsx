import { Button, LinkButton } from "werkbank/component/button";
import { Input, Label, Option, Section, Select } from "werkbank/component/form";
import { Container, Header } from "./component/layout";
import { checkPasswordLength } from "@vulpo-dev/auth-ui";
import { FormEvent, useState } from "react";
import styled from "@emotion/styled";

import {
	useCreateUserMutation,
	useGetEmailSettingsQuery,
} from "../../data/admin_api";
import { useActiveProject } from "../../data/project";
import { NewUser } from "../../admin_sdk";
import { useNavigate } from "react-router-dom";
import { ErrorText } from "../../component/text";

type AuthMethod = "password" | "link";

let CreateUser = () => {
	let projectId = useActiveProject();
	let emailSettings = useGetEmailSettingsQuery([projectId]);
	let [authMethod, setAuthMethod] = useState<AuthMethod>("password");
	let [createUser, createUserResult] = useCreateUserMutation();
	let disabled = createUserResult.isLoading;
	let navigate = useNavigate();

	let handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		let data = new FormData(e.target as HTMLFormElement);

		let newUser: NewUser = {
			project_id: projectId,
			email: data.get("email")?.toString() ?? "",
			provider_id: data.get("provider_id")?.toString() ?? "",
			password: data.get("password")?.toString() ?? "",
		};

		let res = await createUser([newUser]);

		if ("data" in res) {
			navigate(`../${res.data.id}`, { replace: true });
		}
	};

	if (emailSettings.isLoading) {
		return null;
	}

	return (
		<Container>
			<Header>
				<h2>Create User</h2>
			</Header>

			<form
				onChange={() => createUserResult.reset()}
				onSubmit={handleSubmit}
				onReset={() => setAuthMethod("password")}
			>
				<Section>
					<Label htmlFor="email">Email</Label>
					<Input
						autoFocus
						id="email"
						type="email"
						name="email"
						required
						disabled={disabled}
					/>
				</Section>

				<Section>
					<Label htmlFor="provider_id">Authentication Method</Label>
					<Select
						id="provider_id"
						name="provider_id"
						value={authMethod}
						onChange={(e) => setAuthMethod(e.target.value as AuthMethod)}
						disabled={disabled}
					>
						<Option value="password">Password</Option>
						<Option value="link" disabled={emailSettings.data === null}>
							Passwordless
						</Option>
					</Select>
				</Section>

				{authMethod === "password" && (
					<Section>
						<Label>Temporary Password</Label>
						<Input
							type="text"
							name="password"
							onChange={(e) => validatePassword(e.target)}
							required
							disabled={disabled}
						/>
					</Section>
				)}

				{createUserResult.isError && (
					<Section>
						<ErrorText className="text-right">
							Something went wrong:{" "}
							{(createUserResult.error as { type: string }).type}
						</ErrorText>
					</Section>
				)}

				<ButtonSection>
					<LinkButton disabled={disabled} type="reset">
						Reset
					</LinkButton>
					<Button disabled={disabled} type="submit">
						Create User
					</Button>
				</ButtonSection>
			</form>
		</Container>
	);
};

export default CreateUser;

let ButtonSection = styled(Section)`
	display: flex;
	justify-content: flex-end;
	gap: var(--size-1);
`;

function validatePassword(elm: HTMLInputElement) {
	checkPasswordLength(elm, {
		password_min_length: "The password should be at least 8 characters long",
		password_max_length: "The password cannot be longer than 64 characters",
	});
}
