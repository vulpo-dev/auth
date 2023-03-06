import styled from "@emotion/styled";
import { NavLink, Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";

import { useActiveProject } from "../../data/project";
import { PageWrapper, PageContent, PageHeader, PageTitle } from "../../component/page";
import { useGetUsersQuery, adminApi } from "../../data/admin_api";
import { Button } from "../../component/button";
import { AppDispatch } from "../../../app/store";

export let UsersPage = () => {
	let dispatch = useDispatch<AppDispatch>();
	
	let projectId = useActiveProject();
	let { data, ...state } = useGetUsersQuery([projectId]);

	let users = data?.items ?? [];
	let cursor = data?.cursor;

	async function loadMore() {
		if (!cursor) {
			return
		}

		let action = adminApi.endpoints.getUsers.initiate([projectId, cursor]);
		dispatch(action);
	}

	return (
		<PageWrapper>
			<PageHeader>
				<PageTitle>Users</PageTitle>
			</PageHeader>
			<Layout>
				<ListSection>
					<UserList>
						{ users.map(user => {
							return (
								<ListItem key={user.id}>
									<Link to={user.id}>
										<span>{ user.email }</span>
										<CreatedAt>{ user.created_at }</CreatedAt>
									</Link>
								</ListItem>
							)
						})}

						{ cursor &&
							<ListItem>
								<Button
									loading={state.isFetching}
									onClick={loadMore}
									raised
								>
										Load More
								</Button>
							</ListItem>
						}
					</UserList>
				</ListSection>
				<UserSection>
					<Outlet />
				</UserSection>
			</Layout>
		</PageWrapper>
	);
}

let Layout = styled(PageContent)`
	display: grid;
	grid-template-columns: 300px auto;
`

let ListSection = styled.section`
	height: 100%;
	overflow-y: auto;
	overflow-x: hidden;
	background: var(--surface-3);
	border-right: 1px solid #000;
`

let UserList = styled.ul`
	margin: 0;
	padding: 0;
`

let ListItem = styled.li`
	border-bottom: 1px solid #000;
`

let Link = styled(NavLink)`
	display: block;
	padding: var(--size-3) var(--size-5);
	display: flex;
	flex-direction: column;
	text-decoration: none;

	&:hover {
		background: var(--surface-2);
	}

	&.active {
		background: var(--surface-1);
	}
`

let CreatedAt = styled.small`
	text-align: left;
`

let UserSection = styled.section`
	height: 100%;
	overflow-y: auto;
	overflow-x: hidden;	
`
