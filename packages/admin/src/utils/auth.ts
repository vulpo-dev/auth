import { Auth } from "@vulpo-dev/auth-sdk";

export let AuthClient = Auth.create({
	project: window.VULPO_ADMIN_ID,
	baseURL: window.VULPO_ADMIN_BASE_URL ?? "/api",
});
