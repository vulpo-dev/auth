import { FormEvent } from "react";
import styled from "@emotion/styled";
import { DefaultEmailSettings, EmailSettings } from "@vulpo-dev/auth-sdk-admin";
import { Button } from "werkbank/component/button";
import { Input, Section as FormSection, Label } from "werkbank/component/form";

import { Header, Section } from "./layout";
import {
	useGetEmailSettingsQuery,
	useSetEmailSettingsMutation,
} from "../../../data/admin_api";

type Props = {
	project: string;
};

let EmailSettings = ({ project }: Props) => {
	let emailSettings = useGetEmailSettingsQuery([project]);
	let [save, saveResult] = useSetEmailSettingsMutation();

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();

		let data = new FormData(e.target as HTMLFormElement);

		let payload: EmailSettings = {
			api_key: `${data.get("api_key") ?? ""}`,
			from_email: `${data.get("from_email") ?? ""}`,
			from_name: `${data.get("from_name") ?? ""}`,
			host: `${data.get("host") ?? ""}`,
			port: parseInt(`${data.get("port") ?? "465"}`),
			password: `${data.get("password") ?? ""}`,
			username: `${data.get("username") ?? ""}`,
		};

		save([project, payload]);
		// TODO: success toast
	}

	if (emailSettings.data === undefined) {
		return null;
	}

	let data = emailSettings.data ?? DefaultEmailSettings;
	let isLoading = saveResult.isLoading;

	return (
		<Section>
			<form key={project} onSubmit={handleSubmit}>
				<Header>
					<h2>Email</h2>

					<Button
						loading={isLoading}
						disabled={emailSettings.data === undefined}
					>
						Save
					</Button>
				</Header>

				<FormSection>
					<Address>
						<Host>
							<Label htmlFor="email-host">Host:</Label>
							<Input id="email-host" defaultValue={data.host} name='host' />
						</Host>

						<Port>
							<Label htmlFor="email-port">Port:</Label>
							<Input
								type="number"
								id="email-port"
								defaultValue={data.port}
								name='port'
							/>
						</Port>
					</Address>
				</FormSection>
				<FormSection>
					<Label htmlFor="email-from">From Email:</Label>
					<Input
						id="email-from"
						type='email'
						defaultValue={data.from_email}
						name='from_email'
					/>
				</FormSection>
				<FormSection>
					<Label htmlFor="email-from-name">From Name:</Label>
					<Input
						id="email-from-name"
						defaultValue={data.from_name}
						name='from_name'
					/>
				</FormSection>
				<FormSection>
					<Label htmlFor="email-username">Username:</Label>
					<Input
						id="email-username"
						defaultValue={data.username}
						name='username'
					/>
				</FormSection>
				<FormSection>
					<Label htmlFor="email-password">Password:</Label>
					<Input
						id="email-password"
						defaultValue={data.password}
						name='password'
					/>
				</FormSection>
			</form>
		</Section>
	);
};

export default EmailSettings;

let Address = styled.div`
	display: flex;
	gap: var(--size-3);
`;

let Host = styled.div`
	flex-grow: 1;
`;

let Port = styled.div`
	width: var(--size-11);
`;
