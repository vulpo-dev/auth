import styled from "@emotion/styled";
import { useNavigate } from "react-router-dom";
import {
	ArchiveBox,
	ClockClockwise,
	IdentificationCard,
	Trash,
} from "@phosphor-icons/react";

import { Section, Label } from "werkbank/component/form";
import { Button, LinkButton } from "werkbank/component/button";
import { Flow } from "werkbank/component/loading";

import {
	useDeleteUserMutation,
	useDisableUserMutation,
	useGetEmailSettingsQuery,
	useGetUserQuery,
	useRequestPasswordResetMutation,
	useUpdateUserMutation,
	useVerifyUserEmailMutation,
} from "../../data/admin_api";
import { useActiveProject } from "../../data/project";
import { useMatchedUserId } from "../../utils";

import { UserForm } from "./component/user_form";
import { FormEvent, useRef } from "react";
import { UpdateUser } from "../../admin_sdk";
import { Actions, Container, Header } from "./component/layout";
import { UserState } from "@vulpo-dev/auth-sdk";
import { DateTime } from "../../component/date";

type UserDetailsProps = {
	userId: string;
};

let FORM_ID = "user-form";

let UserDetails = ({ userId }: UserDetailsProps) => {
	let project = useActiveProject();
	let user = useGetUserQuery([userId, project]);

	if (user.data === undefined) {
		return (
			<div>
				<Flow size="var(--size-8)" />
			</div>
		);
	}

	return (
		<>
			<UserActions userId={userId} />
			<UserProfile userId={userId} />
		</>
	);
};

let UserProfile = ({ userId }: UserDetailsProps) => {
	let project = useActiveProject();
	let { data: user } = useGetUserQuery([userId, project]);
	let [updateUser, updateUserResult] = useUpdateUserMutation();

	let touched = useRef<boolean>(false);
	let handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (touched.current === false) {
			return;
		}

		let data = new FormData(e.target as HTMLFormElement);
		let updatedUser: UpdateUser = {
			data: JSON.parse(data.get("data")?.toString() ?? "{}"),
			display_name: data.get("display_name")?.toString(),
			email: data.get("email")?.toString() ?? "",
			traits: data.get("traits")?.toString().split(",") ?? [],
		};

		updateUser([userId, project, updatedUser]);
	};

	if (!user) {
		return null;
	}

	return (
		<Container>
			<Header>
				<h2>User Profile</h2>

				<Actions>
					<LinkButton
						form={FORM_ID}
						type="reset"
						disabled={updateUserResult.isLoading}
					>
						Reset
					</LinkButton>
					<Button
						form={FORM_ID}
						type="submit"
						loading={updateUserResult.isLoading}
					>
						Save
					</Button>
				</Actions>
			</Header>
			<UserForm
				key={user.id}
				id={FORM_ID}
				defaultValue={user}
				onSubmit={handleSubmit}
				onChange={() => {
					touched.current = true;
				}}
				onReset={() => {
					touched.current = false;
				}}
			/>
			<Section>
				<Label>Updated At:</Label>
				<p>
					<DateTime value={user.updated_at} />
				</p>
			</Section>
			<Section>
				<Label>Created At:</Label>
				<p>
					<DateTime value={user.created_at} />
				</p>
			</Section>
		</Container>
	);
};

let ActionsContainer = styled(Container)`
	display: flex;
	justify-content: space-evenly;
	gap: var(--size-5);
	flex-wrap: wrap;
`;

let ActionItem = styled(LinkButton)`
	span {
		display: flex;
		gap: var(--size-2);
		justify-content: center;
		align-items: center;
	}
`;

let ActionLabel = styled.label`
	cursor: pointer;
`;

let UserActions = ({ userId }: UserDetailsProps) => {
	let project = useActiveProject();
	let { data: emailSettings } = useGetEmailSettingsQuery([project]);
	let hasEmail = emailSettings !== null;
	let { data: user } = useGetUserQuery([userId, project]);
	let navigate = useNavigate();

	let [deleteUser] = useDeleteUserMutation();
	let [disableUser] = useDisableUserMutation();
	let [verifyEmail] = useVerifyUserEmailMutation();
	let [requestPasswordReset] = useRequestPasswordResetMutation();

	let handleDelete = async () => {
		if (user) {
			let res = await deleteUser([user.id, project]);
			if ("error" in res) {
				return;
			}

			navigate("../");
		}
	};

	let handleVerify = () => {
		if (user) {
			verifyEmail([user.id, project]);
			// TODO: show success notification
		}
	};

	let handleDisable = () => {
		if (user) {
			let newState = user.state === UserState.Disabled ? false : true;
			disableUser([user.id, project, newState]);
			// TODO: user is disabled banner?
		}
	};

	let handleReset = () => {
		if (user) {
			requestPasswordReset([user.email, project]);
		}
	};

	if (!user) {
		return null;
	}

	let disableLabel = user?.state === UserState.Disabled ? "Enable" : "Disable";

	return (
		<ActionsContainer>
			<ActionItem
				onClick={handleDisable}
				title={`${disableLabel} ${user.email}`}
			>
				<ArchiveBox weight='bold' size={24} />
				<ActionLabel>{disableLabel} Account</ActionLabel>
			</ActionItem>
			<ActionItem
				onClick={handleReset}
				disabled={!hasEmail}
				title={
					hasEmail
						? "Request Password Reset"
						: "Disabled: Email Settings missing"
				}
			>
				<ClockClockwise weight='bold' size={24} />
				<ActionLabel>Reset Password</ActionLabel>
			</ActionItem>
			<ActionItem
				onClick={handleVerify}
				disabled={!hasEmail}
				title={
					hasEmail
						? "Send Email Verification"
						: "Disabled: Email Settings missing"
				}
			>
				<IdentificationCard weight='bold' size={24} />
				<ActionLabel>Send Email Verification</ActionLabel>
			</ActionItem>
			<ActionItem onClick={handleDelete} title={`Delete ${user.email}`}>
				<Trash weight='bold' size={24} />
				<ActionLabel>Delete</ActionLabel>
			</ActionItem>
		</ActionsContainer>
	);
};

let StyledEmptyUser = styled.div`
	display: flex;
	justify-content: center;
	padding-top: var(--size-5);
`;

export let EmptyUser = () => {
	return (
		<StyledEmptyUser>
			<h3>No user selected</h3>
		</StyledEmptyUser>
	);
};

export let User = () => {
	let userId = useMatchedUserId();

	if (!userId) {
		return <EmptyUser />;
	}

	return <UserDetails key={userId} userId={userId} />;
};
