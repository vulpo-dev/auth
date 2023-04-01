import { Outlet, Navigate, NavLink } from "react-router-dom";
import { useAuthStateChange } from "@vulpo-dev/auth-react";
import { useState } from "react";
import { UserAuthState } from "@vulpo-dev/auth-sdk";
import { UserCtx } from "../context";
import ProjectRedirect from "./project_redirect";
import { SidebarLayout, Aside, Main } from "werkbank/component/layout";
import styled from "@emotion/styled";

export let AppShell = () => {
	let [user, setUser] = useState<UserAuthState>(undefined);
	useAuthStateChange((session) => {
		if (session === null) {
			setUser(null);
		} else {
			setUser(session?.user);
		}
	});

	if (user === undefined) {
		return <p>...loading</p>;
	}

	if (user === null) {
		return <Navigate to="auth" />;
	}

	return (
		<UserCtx.Provider value={user}>
			<ProjectRedirect />
			<SidebarLayout>
				<Aside open onClose={() => {}}>
					<AsideContent />
				</Aside>
				<Main>
					<Outlet />
				</Main>
			</SidebarLayout>
		</UserCtx.Provider>
	);
};

let AsideContent = () => {
	return (
		<Ul>
			<li>
				<NavLink to="users">Users</NavLink>
			</li>
			<li>
				<NavLink to="auth-methods">Auth Methods</NavLink>
			</li>
			<li>
				<NavLink to="settings">Settings</NavLink>
			</li>
		</Ul>
	);
};

let Ul = styled.ul`
	color: #000;
`;
