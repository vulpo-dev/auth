import styled from "@emotion/styled";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";

import { useActiveProject } from "../../data/project";
import {
	PageWrapper,
	PageContent,
	PageHeader,
	PageTitle,
} from "../../component/page";
import {
	useGetUsersQuery,
	adminApi,
	useGetUserQuery,
	useReloadUsersMutation,
} from "../../data/admin_api";
import { Button } from "../../component/button";
import { AppDispatch } from "../../../app/store";
import { useMatchedUserId } from "../../utils";
import { DateTime } from "../../component/date";
import { ArrowClockwise, MagnifyingGlass, Users } from "@phosphor-icons/react";
import { IconButton } from "werkbank/component/button";
import { useRef } from "react";
import { PartialUser } from "../../admin_sdk";

export let UsersPage = () => {
	let dispatch = useDispatch<AppDispatch>();

	let project = useActiveProject();
	let { data, ...state } = useGetUsersQuery([{ project }]);

	let userListRef = useRef<HTMLSelectElement | null>(null);
	let [reloadUsers, reloadResult] = useReloadUsersMutation();

	let users = data?.items ?? [];
	let cursor = data?.cursor;

	async function loadMore() {
		if (!cursor) {
			return;
		}

		let action = adminApi.endpoints.getUsers.initiate([{ project, cursor }]);
		dispatch(action);
	}

	let userId = useMatchedUserId();

	async function reload() {
		let res = await reloadUsers([{ project }]);

		if ("error" in res) {
			return;
		}

		if (userListRef.current) {
			userListRef.current.scroll({
				top: 0,
				behavior: "smooth",
			});
		}
	}

	return (
		<PageWrapper>
			<StyledPageHeader>
				<PageTitle>
					<Users size="1.2em" />
					<span>Users</span>
					{userId && <UserEmail userId={userId} />}
				</PageTitle>

				<Link to="new">
					<Button>Create User</Button>
				</Link>
			</StyledPageHeader>
			<Layout>
				<ListSection ref={userListRef}>
					<UsersActionsSection>
						<IconButton
							title="Reload Users"
							onClick={reload}
							loading={reloadResult.isLoading}
						>
							<ArrowClockwise size="var(--font-size-3)" />
						</IconButton>
						<IconButton style={{ marginLeft: "auto" }}>
							<MagnifyingGlass size="var(--font-size-3)" />
						</IconButton>
					</UsersActionsSection>
					<UserList>
						{users.map((user) => {
							return (
								<ListItem key={user.id}>
									<UserItem user={user} />
								</ListItem>
							);
						})}

						{cursor && (
							<ListItem>
								<LoadMoreButton loading={state.isFetching} onClick={loadMore}>
									Load More
								</LoadMoreButton>
							</ListItem>
						)}
					</UserList>
				</ListSection>
				<UserSection>
					<Outlet />
				</UserSection>
			</Layout>
		</PageWrapper>
	);
};

type UserEmailProps = {
	userId: string;
};

let UserEmail = ({ userId }: UserEmailProps) => {
	let project = useActiveProject();
	let { data: user } = useGetUserQuery([userId, project]);
	let { state } = useLocation();
	let email = user?.email ?? state?.email;

	if (!email) {
		return null;
	}

	return <span>- {email}</span>;
};

let StyledPageHeader = styled(PageHeader)`
	justify-content: space-between;
`;

let Layout = styled(PageContent)`
	display: grid;
	grid-template-columns: 300px auto;
`;

let ListSection = styled.section`
	height: 100%;
	overflow-y: auto;
	overflow-x: hidden;
	background: var(--color-background--dark);
	border-right: var(--border);
`;

let UsersActionsSection = styled.div`
	position: sticky;
	top: 0;
	background: var(--color-background--dark);
	padding: var(--size-2) var(--size-5);
	border-bottom: var(--border);
	height: var(--size-8);
	display: flex;
	align-items: center;
`;

let UserList = styled.ul`
	margin: 0;
	padding: 0;
`;

let ListItem = styled.li`
	border-bottom: var(--border);
`;

type UserItemProps = {
	user: PartialUser;
};

let UserItem = ({ user }: UserItemProps) => {
	let project = useActiveProject();
	let prefetchUser = adminApi.usePrefetch("getUser");
	let cancel = useRef<number | undefined>(undefined);

	let onEnter = () => {
		cancel.current = window.setTimeout(() => {
			prefetchUser([user.id, project]);
		}, 500);
	};

	let onLeave = () => {
		window.clearTimeout(cancel.current);
		cancel.current = undefined;
	};

	return (
		<StyledNavLink
			onMouseEnter={onEnter}
			onMouseLeave={onLeave}
			to={user.id}
			state={user}
		>
			<Email title={user.email}>{user.email}</Email>
			<UserId title={user.id}>{user.id}</UserId>
			<CreatedAt title={user.created_at}>
				<DateTime value={user.created_at} />
			</CreatedAt>
		</StyledNavLink>
	);
};

let StyledNavLink = styled(NavLink)`
	display: block;
	padding: var(--size-3) var(--size-5);
	display: flex;
	flex-direction: column;
	text-decoration: none;
	color: var(--text-color);

	&:hover {
		background: var(--color-background);
	}

	&.active {
		background: var(--color-background);
	}
`;

let Email = styled.span`
	font-weight: bold;

	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
`;

let CreatedAt = styled.small`
	text-align: left;
`;

let UserId = styled.small`
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
`;

let LoadMoreButton = styled(Button)`
	width: 100%;
`;

let UserSection = styled.section`
	height: 100%;
	overflow-y: auto;
	overflow-x: hidden;
	padding: var(--size-8);
	display: flex;
	align-items: center;
	flex-direction: column;
`;
