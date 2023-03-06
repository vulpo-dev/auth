import { Outlet, Navigate } from "react-router-dom";
import { useAuthStateChange } from "@vulpo-dev/auth-react";
import { useState } from "react";
import { UserAuthState } from "@vulpo-dev/auth-sdk";
import { UserCtx } from "../context";
import ProjectRedirect from "./project_redirect";

export let AppShell = () => {
	let [user, setUser] = useState<UserAuthState>(undefined);
	useAuthStateChange((session) => {
		console.log({ session })
		if (session === null) {
			setUser(null)
		} else {
			setUser(session?.user);
		}
	});

	if (user === undefined) {
		return <p>...loading</p>
	}

	if (user === null) {
		return <Navigate to="auth" />
	}

	return (
		<UserCtx.Provider value={user}>
			<ProjectRedirect />
			<div>
				<h1>AppShell</h1>
				<Outlet />
			</div>
		</UserCtx.Provider>
	)
}

