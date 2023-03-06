import Ky, { HTTPError } from "ky-universal";
import { BooleanLiteral } from "typescript";

import { AuthClient } from "../app/auth";

type Deps = {
	accessToken: () => Promise<string>;
	refreshToken: () => Promise<string>;
	baseURL: string;
	projectId: string;
}

class AdminSDK {
	private http: typeof Ky;

	constructor(deps: Deps) {
		
		this.http = Ky.create({
			prefixUrl: deps.baseURL,
			hooks: {
				beforeRequest: [
					async (request) => {
						let at = await deps.accessToken();
						request.headers.set("Authorization", `bearer ${at}`);		
						request.headers.set("Vulpo-Project", deps.projectId);		
					}
				],
				beforeRetry: [
					async ({ request, error }) => {
						if (error instanceof HTTPError && error.response.status === 401) {
							const token = await deps.refreshToken();
							request.headers.set('Authorization', `bearer ${token}`);
						}
					}
				]
			}
		});
	}

	getProjects = () => {
		let url = 'admin/project/list';
		return this.http.get(url).json<Projects>()
	}

	getUsers = () => {
		let params = new URLSearchParams({
			project: "ae16cc4a-33be-4b4e-a408-e67018fe453b",
			sort: "desc",
			limit: "50",
		})

		let url = `user/list?${params.toString()}`;

		return this.http.get(url).json<{ items: Array<PartialUser>, cursor: string | null }>()
	}

	getUser = () => {
		let url = 'user/get';
		return this.http.get(url).json<{ email: string }>()
	}
}

export let adminApi = new AdminSDK({
	accessToken: () => AuthClient.getToken(),
	refreshToken: () => AuthClient.forceToken(),
	baseURL: "http://localhost:8000/api",
	projectId: "f4db2736-ce01-40d7-9a3b-94e5d2a648c8",
});

export class UnauthenticatedError extends Error {}

type Project = {
	id: string;
	domain: string;
	is_admin: boolean;
	name: string;
}

type Projects = Array<Project>;

type PartialUser = {
	id: string;
	email: string;
	created_at: string;
}