import { RouteObject } from "react-router-dom";

import { UsersPage } from "./users";
import User from "../user";
import CreateUser from "../user/create";
import EmptyUser from "../user/empty";

let Route: RouteObject = {
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
};

export default Route;
