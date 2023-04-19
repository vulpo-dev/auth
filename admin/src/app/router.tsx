import { createBrowserRouter, Navigate, RouteObject } from "react-router-dom";

import { AppShell } from "@vulpo-dev/auth-admin-dashboard-core/component/app_shell";
import ProjectRedirect from "@vulpo-dev/auth-admin-dashboard-core/component/project_redirect";

import AuthPage from "@vulpo-dev/auth-admin-dashboard-core/pages/auth";
import SettingsPage from "@vulpo-dev/auth-admin-dashboard-core/pages/settings";
import UsersPage from "@vulpo-dev/auth-admin-dashboard-core/pages/users";
import AuthMethods from "@vulpo-dev/auth-admin-dashboard-core/pages/methods";

import Nav from "@vulpo-dev/auth-admin-dashboard-core/component/nav";

let routes: Array<RouteObject> = [
	{
		path: "auth/*",
		element: <AuthPage />,
	},
	{
		path: ":projectId/*",
		element: <AppShell nav={<Nav />} />,
		children: [
			UsersPage,
			SettingsPage,
			AuthMethods,
			{
				path: "*",
				element: <Navigate to="users" />,
			},
		],
	},
	{
		path: "/*",
		element: <ProjectRedirect />,
	},
];

export let Router = createBrowserRouter(routes, {
	basename: "/dashboard",
});
