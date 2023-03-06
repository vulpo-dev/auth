import { createBrowserRouter, Navigate, RouteObject } from "react-router-dom";

import AuthPage from "../lib/pages/auth";
import SettingsPage from "../lib/pages/settings";
import UsersPage from "../lib/pages/users";
import { AppShell } from "../lib/component/app_shell";
import ProjectRedirect from "../lib/component/project_redirect";

let User = () => {
	return <h1>User</h1>
}

let routes: Array<RouteObject> = [{
	path: "auth/*",
	element: <AuthPage />,
}, {
	path: ":projectId/*",
	element: <AppShell />,
	children: [{
		path: 'users',
		element: <UsersPage />,
		children: [{
			path: ':userId',
			element: <User />
		}]
	},{
		path: 'settings',
		element: <SettingsPage />,
	}, {
		path: '*',
		element: <Navigate to="users" />
	}]
}, {
	path: "/*",
	element: <ProjectRedirect />,
}]

export let Router = createBrowserRouter(routes, {
	basename: "/dashboard"
});

