import { User } from "@vulpo-dev/auth-sdk";
import { createContext, useContext } from "react";
import { useMatches } from "react-router-dom";

export let UserCtx = createContext<User | null>(null);

export function useUser(): User {
	let user = useContext(UserCtx);

	if (user === null) {
		throw Error("useUser is was used outside authenticated route");
	}

	return user;
}
