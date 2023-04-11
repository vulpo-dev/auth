import { Auth } from "@vulpo-dev/auth-sdk";

export let AuthClient = Auth.create({
	project: window.VULPO_ADMIN_ID,
	baseURL: "/api",
});
