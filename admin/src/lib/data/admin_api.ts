import { BaseQueryFn, createApi } from "@reduxjs/toolkit/query/react";

import { adminApi as api, UnauthenticatedError } from "../admin_sdk";

type ApiResponse<Fn extends (...args: any) => Promise<any>> = Awaited<ReturnType<Fn>>;

let toQueryFn = <Fn extends (...args: any) => Promise<any>>(fn: Fn): BaseQueryFn<Parameters<Fn>, ApiResponse<Fn>> => {
	return async (args) => {
		try {
			let fnArgs = Array.from(args)
			let data = await fn(...fnArgs)
			return { data }
		} catch (error) {
			if (error instanceof UnauthenticatedError) {
				return { error: { type: 'unauthenticated' }}
			}

			return { error: { type: 'generic' } }
		} 
	}
}

let adminApiQuery: BaseQueryFn = (_args) => {
	return { data: null }
} 

export let adminApi = createApi({
	reducerPath: "admin_api",
	baseQuery: adminApiQuery,
	endpoints: (builder) => ({
		getProjects: builder.query({
			queryFn: toQueryFn(api.getProjects), 
		}),
		getUsers: builder.query({
			queryFn: toQueryFn(api.getUsers),
			serializeQueryArgs: ({ endpointName, queryArgs }) => {
				let [projectId] = queryArgs;
				return `${endpointName}::${projectId}`
			},
			merge: (currentCache: NonNullable<ApiResponse<typeof api.getUsers>>, res: ApiResponse<typeof api.getUsers>, other) => {
				let isInitialRequest = other.arg.length === 1;
				let notEmpty = currentCache.items.length > 0;

				if (notEmpty && isInitialRequest) {
					return currentCache;
				}

				currentCache.items.push(...res?.items ?? []);
				currentCache.cursor = res?.cursor ?? null;
			},
			forceRefetch({ currentArg, previousArg }) {
				if (!previousArg) {
					return true;
				}

				let project = currentArg[0] !== previousArg[0];
				let cursor = currentArg[1] !== previousArg[1];
				return project || cursor;
			}
		}),
		getUser: builder.query({
			queryFn: toQueryFn(api.getUser),
		})
	})
})

export let {
 useGetProjectsQuery,
 useGetUsersQuery,
 useGetUserQuery,
} = adminApi;
