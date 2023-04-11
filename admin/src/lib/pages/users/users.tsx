import styled from "@emotion/styled";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import ContentLoader from "react-content-loader";
import { ArrowClockwise, MagnifyingGlass, Users } from "@phosphor-icons/react";
import { IconButton } from "werkbank/component/button";
import { useReducer, useRef } from "react";
import { PartialUser } from "@vulpo-dev/auth-sdk-admin";

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
import { useMatchedUserId } from "../../utils";
import { DateTime } from "../../component/date";
import Search from "../../component/search";

let LOADING_ITEMS = Array(7).fill(null);

type SearchAction =
	| { type: "open" }
	| { type: "search"; query: string }
	| { type: "close" };

type SearchReducerState =
	| { state: "closed"; query: undefined }
	| { state: "open"; query: undefined }
	| { state: "search"; query: string };

let searchReducer = (
	state: SearchReducerState,
	action: SearchAction,
): SearchReducerState => {
	switch (action.type) {
		case "open":
			return { state: "open", query: undefined };
		case "close":
			return { state: "closed", query: undefined };
		case "search":
			return { state: "search", query: action.query };
		default:
			return state;
	}
};

export let UsersPage = () => {
	let dispatch = useDispatch();
	let project = useActiveProject();

	let [search, dispatchSearch] = useReducer(searchReducer, {
		state: "closed",
		query: undefined,
	});

	let { data, ...state } = useGetUsersQuery([
		{
			project,
			search: search.query,
		},
	]);

	let userListRef = useRef<HTMLSelectElement | null>(null);
	let [reloadUsers, reloadResult] = useReloadUsersMutation();

	let users = data?.items;
	let cursor = data?.cursor;

	function scrollTop() {
		if (userListRef.current) {
			userListRef.current.scroll({
				top: 0,
				behavior: "smooth",
			});
		}
	}

	async function loadMore() {
		if (!cursor) {
			return;
		}

		let action = adminApi.endpoints.getUsers.initiate([
			{
				project,
				cursor,
				search: search.query,
			},
		]);

		dispatch(action);
	}

	let userId = useMatchedUserId();

	async function reload() {
		let res = await reloadUsers([{ project }]);

		if ("error" in res) {
			return;
		}

		scrollTop();
	}

	function toggleSearch(type: "close" | "open") {
		return () => {
			dispatchSearch({ type });
			scrollTop();
		};
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
						{search.state === "closed" ? (
							<>
								<IconButton
									title="Reload Users"
									onClick={reload}
									loading={reloadResult.isLoading}
								>
									<ArrowClockwise size="var(--font-size-3)" />
								</IconButton>
								<IconButton
									onClick={toggleSearch("open")}
									style={{ marginLeft: "auto" }}
								>
									<MagnifyingGlass size="var(--font-size-3)" />
								</IconButton>
							</>
						) : (
							<Search
								onCancel={toggleSearch("close")}
								onSearch={(query) => dispatchSearch({ type: "search", query })}
							/>
						)}
					</UsersActionsSection>
					<UserList>
						{users ? (
							<>
								{users.map((user) => {
									return (
										<ListItem key={user.id}>
											<UserItem user={user} />
										</ListItem>
									);
								})}

								{cursor && (
									<ListItem>
										<LoadMoreButton
											loading={state.isFetching}
											onClick={loadMore}
										>
											Load More
										</LoadMoreButton>
									</ListItem>
								)}
							</>
						) : (
							<>
								{LOADING_ITEMS.map((_, index) => {
									return (
										<ListItem key={index}>
											<LoadingUserItem />
										</ListItem>
									);
								})}
							</>
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
	z-index: 1;
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

let LoadingUserItem = () => {
	return (
		<ContentLoader
			viewBox="0 0 300 96"
			width="100%"
			backgroundColor="var(--gray-5)"
			foregroundColor="var(--gray-4)"
			style={{ opacity: 0.5 }}
		>
			<rect x="24" y="16" rx="5" ry="5" width="250" height="24" />
			<rect x="24" y="45" rx="5" ry="5" width="230" height="16" />
			<rect x="24" y="66" rx="5" ry="5" width="180" height="16" />
		</ContentLoader>
	);
};

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
