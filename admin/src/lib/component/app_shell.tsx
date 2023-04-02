import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuthStateChange } from "@vulpo-dev/auth-react";
import { UserAuthState } from "@vulpo-dev/auth-sdk";
import { UserCtx } from "../context";
import ProjectRedirect from "./project_redirect";
import { SidebarLayout, Aside, Main } from "werkbank/component/layout";

import Sidebar from "./sidebar";

let SIDEBAR_BREAKPOINT = "(max-width: 768px)";

export let AppShell = () => {
	let [user, setUser] = useState<UserAuthState>(undefined);
	let [sidebar, setSidebar] = useState<boolean>(() => {
		return window.matchMedia(SIDEBAR_BREAKPOINT).matches === false;
	})

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
				<Aside open={sidebar} onClose={() => setSidebar(false)}>
					<Sidebar />
				</Aside>
				<Main>
					<Outlet />
				</Main>
			</SidebarLayout>
		</UserCtx.Provider>
	);
};
