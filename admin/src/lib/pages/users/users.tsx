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
} from "../../data/admin_api";
import { Button } from "../../component/button";
import { AppDispatch } from "../../../app/store";
import { useMatchedUserId } from "../../utils";
import { DateTime } from "../../component/date";

export let UsersPage = () => {
	let dispatch = useDispatch<AppDispatch>();

	let project = useActiveProject();
	let { data, ...state } = useGetUsersQuery([{ project }]);

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

	return (
		<PageWrapper>
			<StyledPageHeader>
				<PageTitle>Users {userId && <UserEmail userId={userId} />}</PageTitle>

				<Link to="new">
					<Button raised>Create User</Button>
				</Link>
			</StyledPageHeader>
			<Layout>
				<ListSection>
					<UserList>
						{users.map((user) => {
							return (
								<ListItem key={user.id}>
									<StyledNavLink to={user.id} state={user}>
										<Email title={user.email}>{user.email}</Email>
										<small>{user.id}</small>
										<CreatedAt>
											<DateTime value={user.created_at} />
										</CreatedAt>
									</StyledNavLink>
								</ListItem>
							);
						})}

						{cursor && (
							<ListItem>
								<Button loading={state.isFetching} onClick={loadMore} raised>
									Load More
								</Button>
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

let UserList = styled.ul`
	margin: 0;
	padding: 0;
`;

let ListItem = styled.li`
	border-bottom: var(--border);
`;

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

let UserSection = styled.section`
	height: 100%;
	overflow-y: auto;
	overflow-x: hidden;
	padding: var(--size-8);
`;
