import Ky, { HTTPError } from "ky-universal";

import { AuthClient } from "../app/auth";

/* USER */
type GetUsers = {
	project: string;
	sort?: "desc" | "asc";
	limit?: number;
	cursor?: string;
	search?: string;
};

enum UserState {
	Active = "active",
	Disabled = "disabled",
	SetPassword = "set_password",
}

type Uuid = string;
type Option<T> = T | null | undefined;
type DateTime = string;

export type User = {
	id: Uuid;
	display_name: Option<string>;
	email: string;
	email_verified: boolean;
	photo_url: Option<string>;
	traits: Array<string>;
	data: Record<string, unknown>;
	provider_id: string;
	created_at: DateTime;
	updated_at: DateTime;
	state: UserState;
	device_languages: Array<string>;
};

export type UpdateUser = {
	display_name: Option<string>;
	email: string;
	traits: Array<string>;
	data: Record<string, unknown>;
};

export type NewUser = {
	email: string;
	project_id: Uuid;
	password?: Option<string>;
	display_name?: Option<string>;
	data?: Option<{ [key: string]: unknown }>;
	provider_id: string;
};

/* EMAIL */
export type EmailSettings = {
	host: string;
	from_email: string;
	from_name: string;
	api_key: string;
	username: string;
	password: string;
	port: number | string;
};

export let DefaultEmailSettings: EmailSettings = {
	host: "",
	from_email: "",
	from_name: "",
	api_key: "",
	username: "",
	password: "",
	port: 465,
};

/* GOOGLE */
export type GoogleConfig = {
	client_id: string;
	client_secret: string;
	redirect_uri: string;
};

let defaultGoolgeConfig: GoogleConfig = {
	client_id: "",
	client_secret: "",
	redirect_uri: "",
};

/* FLAGS */
export enum Flags {
	SignIn = "auth::signin",
	SignUp = "auth::signup",
	PasswordReset = "action::password_reset",
	VerifyEmail = "action::verify_email",

	EmailAndPassword = "method::email_password",
	AuthenticationLink = "method::authentication_link",

	OAuthGoogle = "oauth::google",
}

export function isFlag(flag: string | Flags): boolean {
	let index = Object.values(Flags).findIndex((value) => {
		return value === flag;
	});

	return index !== -1;
}

export function getFlagsFromRequest(flags: Array<string>): Array<Flags> {
	let items = flags.filter((flag) => isFlag(flag));

	return items as Array<Flags>;
}

export type ProjectFlags = Array<Flags>;

export type ProjectSettings = {
	project: string;
	name: string;
	domain: string;
};

/* Keys */
type PublicKey = {
	id: string;
	key: string;
};

/* SDK */
type Deps = {
	accessToken: () => Promise<string>;
	refreshToken: () => Promise<string>;
	baseURL: string;
	projectId: string;
};

class AdminSDK {
	private http: typeof Ky;

	constructor(deps: Deps) {
		this.http = Ky.create({
			prefixUrl: deps.baseURL,
			retry: {
				limit: 3,
				statusCodes: [401],
				methods: ["get", "post", "option"],
			},
			hooks: {
				beforeRequest: [
					async (request) => {
						let at = await deps.accessToken();
						request.headers.set("Authorization", `bearer ${at}`);
						request.headers.set("Vulpo-Project", deps.projectId);
					},
				],
				beforeRetry: [
					async ({ request, error }) => {
						if (error instanceof HTTPError && error.response.status === 401) {
							const token = await deps.refreshToken();
							request.headers.set("Authorization", `bearer ${token}`);
						}
					},
				],
			},
		});
	}

	getProjects = () => {
		let url = "admin/project/list";
		return this.http.get(url).json<Projects>();
	};

	setProject = (project: ProjectSettings) => {
		let url = "settings/project";
		return this.http.post(url, { json: project });
	};

	deleteProject = (project: Uuid) => {
		let url = "project/delete";
		return this.http.post(url, { json: { project } });
	};

	createProject = (project: NewProject) => {
		let url = "admin/project/create";
		return this.http.post(url, { json: project }).json<[string]>();
	};

	getUsers = ({ project, sort = "desc", limit = 50, cursor, search }: GetUsers) => {
		let params = new URLSearchParams({
			project,
			sort,
			limit: limit.toString(),
		});

		if (cursor) {
			params.append("cursor", cursor);
		}

		if (search) {
			params.append("search", search);
		}

		let url = `user/list?${params.toString()}`;

		return this.http
			.get(url)
			.json<{ items: Array<PartialUser>; cursor: string | null }>();
	};

	getUser = (userId: string, project: string) => {
		let params = new URLSearchParams([
			["user", userId],
			["project", project],
		]);

		let url = `user/get_by_id?${params}`;
		return this.http.get(url).json<User>();
	};

	updateUser = async (userId: Uuid, projectId: Uuid, user: UpdateUser) => {
		let params = new URLSearchParams([
			["user_id", userId],
			["project_id", projectId],
		]);

		let url = `user/admin/update?${params}`;
		await this.http.post(url, {
			json: user,
		});

		return null;
	};

	createUser = (user: NewUser) => {
		return this.http.post("admin/create_user", { json: user }).json<User>();
	};

	deleteUser = async (userId: Uuid, projectId: Uuid) => {
		let url = `user/admin/delete_account/${userId}`;
		await this.http.post(url);
		return { userId, projectId };
	};

	disableUser = (userId: Uuid, projectId: Uuid, disabled: boolean) => {
		let url = "user/disable";
		let json = {
			user: userId,
			project: projectId,
			disabled,
		};

		return this.http.post(url, { json });
	};

	verifyUserEmail = (userId: Uuid, projectId: Uuid) => {
		let url = "user/send_email_verification";
		let json = {
			user_id: userId,
			project_id: projectId,
		};

		return this.http.post(url, { json });
	};

	requestPasswordReset = (email: string, projectId: Uuid) => {
		let url = `admin/request_password_reset/${projectId}`;
		let json = { email };
		return this.http.post(url, { json });
	};

	getEmailSettings = (projectId: Uuid) => {
		let params = new URLSearchParams([["project_id", projectId]]);

		let url = `settings/email?${params}`;

		return this.http.get(url).json<EmailSettings | null>();
	};

	setEmailSettings = (projectId: Uuid, settings: EmailSettings) => {
		let params = new URLSearchParams([["project_id", projectId]]);
		let url = `settings/email?${params}`;
		return this.http.post(url, { json: settings });
	};

	getFlags = (projectId: Uuid) => {
		let params = new URLSearchParams([["project", projectId]]);
		let url = `project/flags?${params}`;
		return this.http.get(url).json<{ items: ProjectFlags }>();
	};

	setFlags = (projectId: Uuid, flags: ProjectFlags) => {
		type UpdateFlags = {
			project: string;
			flags: Array<Flags>;
		};

		let json: UpdateFlags = {
			project: projectId,
			flags,
		};

		let url = "project/set_flags";
		return this.http.post(url, { json });
	};

	getGoogleSettings = async (projectId: Uuid): Promise<GoogleConfig> => {
		let params = new URLSearchParams([["project", projectId]]);
		let url = `oauth/google/get_config?${params}`;
		let config = await this.http.get(url).json<GoogleConfig | null>();
		return config ?? defaultGoolgeConfig;
	};

	saveGoogleSettings = async (projectId: Uuid, config: GoogleConfig) => {
		let params = new URLSearchParams([["project", projectId]]);
		let url = `oauth/google/set_config?${params}`;
		return this.http.post(url, { json: config });
	};

	getPublicKeys = (projectId: Uuid) => {
		let params = new URLSearchParams([["project", projectId]]);
		let url = `keys/public?${params}`;
		return this.http.get(url).json<Array<PublicKey>>();
	};
}

export let adminApi = new AdminSDK({
	accessToken: () => AuthClient.getToken(),
	refreshToken: () => AuthClient.forceToken(),
	baseURL: "http://localhost:8000/api",
	projectId: "f4db2736-ce01-40d7-9a3b-94e5d2a648c8",
});

export class UnauthenticatedError extends Error {}

export type Project = {
	id: string;
	domain: string;
	is_admin: boolean;
	name: string;
};

export type NewProject = {
	name: string;
	domain: string;
};

type Projects = Array<Project>;

export type PartialUser = {
	id: string;
	email: string;
	created_at: string;
};
