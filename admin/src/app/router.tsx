import { createBrowserRouter, Navigate, RouteObject } from "react-router-dom";

import { AppShell } from "../lib/component/app_shell";
import ProjectRedirect from "../lib/component/project_redirect";

import AuthPage from "../lib/pages/auth";
import SettingsPage from "../lib/pages/settings";
import UsersPage from "../lib/pages/users";
import User, { EmptyUser } from "../lib/pages/user";
import CreateUser from "../lib/pages/user/create";
import AuthMethods from "../lib/pages/methods";

let routes: Array<RouteObject> = [
	{
		path: "auth/*",
		element: <AuthPage />,
	},
	{
		path: ":projectId/*",
		element: <AppShell />,
		children: [
			{
				id: "users",
				path: "users",
				element: <UsersPage />,
				children: [
					{
						id: "user-new",
						path: "new",
						element: <CreateUser />,
					},
					{
						id: "user-detail",
						path: ":userId",
						element: <User />,
					},
					{
						path: "*",
						element: <EmptyUser />,
					},
				],
			},
			{
				path: "settings",
				element: <SettingsPage />,
			},
			{
				path: "auth-methods",
				element: <AuthMethods />,
			},
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
