import React, { FormEvent, useCallback, useState } from "react";
import styled from "@emotion/styled";
import { Button } from "werkbank/component/button";
import { Input, Label, Section } from "werkbank/component/form";
import { Flow } from "werkbank/component/loading";

import adminApi, {
	useGetEmailSettingsQuery,
	useGetFlagsQuery,
	useGetGoogleSettingsQuery,
	useSaveGoogleSettingsMutation,
	useSetFlagsMutation,
} from "../../data/admin_api";
import { useActiveProject } from "../../data/project";
import { Flags, GoogleConfig, ProjectFlags } from "../../admin_sdk";
import {
	PageContent,
	PageHeader,
	PageTitle,
	PageWrapper,
} from "../../component/page";
import { Key } from "@phosphor-icons/react";

let MAIN = "main-form";
let GOOGLE = "google-form";

export function usePrefetchAuthMethods() {
	let prefetchEmailSettings = adminApi.usePrefetch("getEmailSettings");
	let prefetchGoogleSettings = adminApi.usePrefetch("getGoogleSettings");
	let prefetchFlags = adminApi.usePrefetch("getFlags");

	return useCallback((project: string) => {
		prefetchFlags([project]);
		prefetchEmailSettings([project]);
		prefetchGoogleSettings([project]);
	}, []);
}

export let AuthMethods = () => {
	let project = useActiveProject();
	let flags = useGetFlagsQuery([project]);
	let { data: emailSettings } = useGetEmailSettingsQuery([project]);
	let [updateFlags, updateFlagsResult] = useSetFlagsMutation();
	let googleConfig = useGetGoogleSettingsQuery([project]);
	let [saveGoogleConfig, saveGoogleConfigResult] =
		useSaveGoogleSettingsMutation();

	if (flags.isLoading || googleConfig.data === undefined) {
		return (
			<PageWrapper>
				<PageHeader>
					<PageTitle>
						<Key size="1.2em" />
						<span>Authentication Methods</span>
					</PageTitle>
				</PageHeader>

				<StyledPageContent
					style={{ display: "flex", justifyContent: "center" }}
				>
					<Flow size="var(--size-8)" />
				</StyledPageContent>
			</PageWrapper>
		);
	}

	let hasEmail = emailSettings !== null || emailSettings !== undefined;
	let items = flags.data?.items ?? [];

	let handleGoogleForm = (e: FormEvent) => {
		e.preventDefault();

		let data = new FormData(e.target as HTMLFormElement);

		let payload: GoogleConfig = {
			client_id: data.get("client_id")?.toString() ?? "",
			client_secret: data.get("client_secret")?.toString() ?? "",
			redirect_uri: data.get("redirect_uri")?.toString() ?? "",
		};

		saveGoogleConfig([project, payload]);
		// TODO: Success Toast
	};

	let handleMainForm = (e: FormEvent) => {
		e.preventDefault();

		let data = Array.from(new FormData(e.target as HTMLFormElement).entries())
			.map((entry) => {
				switch (entry[0]) {
					case "signin":
						return Flags.SignIn;
					case "signup":
						return Flags.SignUp;
					case "auth_link":
						return Flags.AuthenticationLink;
					case "email_password":
						return Flags.EmailAndPassword;
					case "verify_email":
						return Flags.VerifyEmail;
					case "reset_password":
						return Flags.PasswordReset;
					case "oauth_google":
						return Flags.OAuthGoogle;
				}
			})
			.filter((entry): entry is Flags => entry !== undefined);

		updateFlags([project, data]);
		// TODO: Success Toast
	};

	return (
		<PageWrapper>
			<PageHeader>
				<PageTitle>
					<Key size="1.2em" />
					<span>Authentication Methods</span>
				</PageTitle>
			</PageHeader>

			<StyledPageContent>
				<Container key={project}>
					<form id={MAIN} onSubmit={handleMainForm} />
					<form id={GOOGLE} onSubmit={handleGoogleForm} />

					<FlagList>
						<Flag>
							<FlagHeader>
								<FlagTitle htmlFor='signin'>Sign In</FlagTitle>
								<input
									form={MAIN}
									id='signin'
									name="signin"
									type='checkbox'
									defaultChecked={items.includes(Flags.SignIn)}
								/>
							</FlagHeader>
						</Flag>

						<Flag>
							<FlagHeader>
								<FlagTitle htmlFor='signup'>Sign Up</FlagTitle>
								<input
									form={MAIN}
									id='signup'
									name='signup'
									type='checkbox'
									defaultChecked={items.includes(Flags.SignUp)}
								/>
							</FlagHeader>
						</Flag>

						<Flag disabled={!hasEmail}>
							<FlagHeader
								title={
									hasEmail
										? "Authentication Link"
										: "Disabled: Add email settings"
								}
							>
								<FlagTitle htmlFor='auth_link'>Authentication Link</FlagTitle>
								<input
									form={MAIN}
									id='auth_link'
									name='auth_link'
									type='checkbox'
									disabled={!hasEmail}
									defaultChecked={items.includes(Flags.AuthenticationLink)}
								/>
							</FlagHeader>
						</Flag>

						<EmailAndPassword items={items} hasEmail={hasEmail} />
						<GoogleForm
							items={items}
							config={googleConfig.data}
							loading={saveGoogleConfigResult.isLoading}
						/>
					</FlagList>
					<ButtonWrapper>
						<Button form={MAIN} loading={updateFlagsResult.isLoading}>
							Save
						</Button>
					</ButtonWrapper>
				</Container>

				<div style={{ height: "var(--size-10)", flexShrink: 0 }} />
			</StyledPageContent>
		</PageWrapper>
	);
};

type EmailAndPasswordProps = {
	items: ProjectFlags;
	hasEmail: boolean;
};

let EmailAndPassword = ({ items, hasEmail }: EmailAndPasswordProps) => {
	let [showPasswordOptions, setShowPasswordOptions] = useState<boolean>(() => {
		return items.includes(Flags.EmailAndPassword);
	});

	return (
		<Flag>
			<FlagHeader>
				<FlagTitle htmlFor='email_password'>Email and Password</FlagTitle>
				<input
					form={MAIN}
					id='email_password'
					name='email_password'
					type='checkbox'
					defaultChecked={items.includes(Flags.EmailAndPassword)}
					onChange={(e) => setShowPasswordOptions(e.target.checked)}
				/>
			</FlagHeader>
			{showPasswordOptions && (
				<FlagList>
					<Flag disabled={!hasEmail}>
						<FlagHeader>
							<FlagTitle htmlFor='reset_password'>Reset Password</FlagTitle>
							<input
								form={MAIN}
								id='reset_password'
								name='reset_password'
								type='checkbox'
								disabled={!hasEmail}
								defaultChecked={items.includes(Flags.PasswordReset)}
							/>
						</FlagHeader>
					</Flag>

					<Flag disabled={!hasEmail}>
						<FlagHeader>
							<FlagTitle htmlFor='verify_email'>Verify Email</FlagTitle>
							<input
								form={MAIN}
								id='verify_email'
								name='verify_email'
								type='checkbox'
								disabled={!hasEmail}
								defaultChecked={items.includes(Flags.VerifyEmail)}
							/>
						</FlagHeader>
					</Flag>
				</FlagList>
			)}
		</Flag>
	);
};

type GoogleFormProps = {
	items: ProjectFlags;
	config: GoogleConfig;
	loading: boolean;
};

let GoogleForm = ({ items, config, loading }: GoogleFormProps) => {
	let [showGoogleForm, setShowGoogleForm] = useState<boolean>(() => {
		return items.includes(Flags.OAuthGoogle);
	});

	return (
		<Flag>
			<FlagHeader>
				<FlagTitle>Google</FlagTitle>
				<input
					form={MAIN}
					id='oauth_google'
					name='oauth_google'
					type='checkbox'
					defaultChecked={items.includes(Flags.OAuthGoogle)}
					onChange={(e) => setShowGoogleForm(e.target.checked)}
				/>
			</FlagHeader>
			{showGoogleForm && (
				<NestedContainer>
					<Header>
						<Button form={GOOGLE} loading={loading}>
							Save Config
						</Button>
					</Header>
					<Section>
						<Label>Client ID</Label>
						<Input
							form={GOOGLE}
							type="text"
							name="client_id"
							defaultValue={config.client_id}
							required
						/>
					</Section>
					<Section>
						<Label>Client Secret</Label>
						<Input
							form={GOOGLE}
							type="text"
							name="client_secret"
							defaultValue={config.client_secret}
							required
						/>
					</Section>
					<Section>
						<Label>Redirect URI</Label>
						<Input
							form={GOOGLE}
							type="url"
							name="redirect_uri"
							defaultValue={config.redirect_uri}
							required
						/>
					</Section>
				</NestedContainer>
			)}
		</Flag>
	);
};

let StyledPageContent = styled(PageContent)`
	padding: var(--size-8);
`;

let Container = styled.div`
	max-width: var(--container-width);
	width: 100%;
	margin: 0 auto;
`;

let FlagList = styled.ul`
	padding: 0;
	list-style-type: none;
	flex-shrink: 0;
	width: 100%;
	margin-top: 0;

	& {
		margin-top: var(--size-2); 
	}
`;

let Flag = styled.li<{ disabled?: boolean }>`
	widht: 100%;
	background: #222043;
	border: 2px solid #000;
	margin-bottom: var(--size-2);
	min-height: calc(var(--size-2) * 6);
	padding: var(--size-2) var(--size-5);
	display: flex;
	flex-direction: column;
	flex-wrap: wrap;
	opacity: ${(p) => (p.disabled ? "0.8" : "1")};
`;

let FlagHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

let FlagTitle = styled.label`
	margin: 0;
	flex-grow: 1;
	cursor: pointer;
	font-size: calc(var(--size-2) * 2.5);
`;

let ButtonWrapper = styled.section`
	display: flex;
	justify-content: flex-end;
`;

let NestedContainer = styled.form`
	margin-top: 1rem;
`;

let Header = styled.div`
	display: flex;
	justify-content: flex-end;
`;
