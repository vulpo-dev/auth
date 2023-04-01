import { BaseQueryFn, createApi } from "@reduxjs/toolkit/query/react";
import { UserState } from "@vulpo-dev/auth-sdk";
import { HTTPError } from "ky";

import { adminApi as api, UnauthenticatedError } from "../admin_sdk";

type ApiResponse<Fn extends (...args: Array<any>) => Promise<any>> = Awaited<
	ReturnType<Fn>
>;

let toQueryFn = <Fn extends (...args: Array<any>) => Promise<any>>(
	fn: Fn,
): BaseQueryFn<Parameters<Fn>, ApiResponse<Fn>, { type: string }> => {
	return async (args: Parameters<Fn>) => {
		try {
			let fnArgs = Array.from(args);
			let data = await fn(...fnArgs);

			if (data instanceof Response) {
				return { data: null };
			}

			return { data };
		} catch (error) {
			console.log({ error });
			if (error instanceof UnauthenticatedError) {
				return { error: { type: "unauthenticated" } };
			}

			if (error instanceof HTTPError) {
				let { code }: { code: string } = await error.response.json();
				return { error: { type: code } };
			}

			return { error: { type: "generic" } };
		}
	};
};

let adminApiQuery: BaseQueryFn = (_args) => {
	return { data: null };
};

export let adminApi = createApi({
	reducerPath: "admin_api",
	baseQuery: adminApiQuery,
	tagTypes: ["User"],
	endpoints: (builder) => ({
		getProjects: builder.query({
			queryFn: toQueryFn<typeof api.getProjects>(api.getProjects),
		}),

		getUsers: builder.query({
			queryFn: toQueryFn<typeof api.getUsers>(api.getUsers),
			serializeQueryArgs: ({ endpointName, queryArgs }) => {
				let [{ project }] = queryArgs;
				return `${endpointName}::${project}`;
			},
			merge: (
				currentCache: NonNullable<ApiResponse<typeof api.getUsers>>,
				res: ApiResponse<typeof api.getUsers>,
				other,
			) => {
				let [arg] = other.arg;
				let hasCursor = arg?.cursor !== undefined;
				let notEmpty = currentCache.items.length > 0;

				if (notEmpty && !hasCursor) {
					return currentCache;
				}

				let items = res?.items ?? [];
				items.forEach((item) => {
					if (
						currentCache.items.findIndex((user) => user.id === item.id) === -1
					) {
						currentCache.items.push(item);
					}
				});

				currentCache.cursor = res?.cursor ?? null;
			},
			forceRefetch({ currentArg, previousArg }) {
				if (!previousArg) {
					return true;
				}

				let project = currentArg?.[0].project !== previousArg[0].project;
				let cursor = currentArg?.[0].cursor !== previousArg[0].cursor;
				return project || cursor;
			},
		}),

		getUser: builder.query({
			queryFn: toQueryFn<typeof api.getUser>(api.getUser),
			providesTags: (result, _error, _arg) =>
				result ? [{ type: "User" as const, id: result.id }, "User"] : ["User"],
		}),

		updateUser: builder.mutation({
			queryFn: toQueryFn<typeof api.updateUser>(api.updateUser),
			async onQueryStarted(
				[userId, projectId, patch],
				{ dispatch, queryFulfilled },
			) {
				try {
					await queryFulfilled;
					dispatch(
						adminApi.util.updateQueryData(
							"getUser",
							[userId, projectId],
							(user) => {
								Object.assign(user, patch);
							},
						),
					);
				} catch (err) {
					console.error("updateUser: ", err);
				}
			},
		}),

		createUser: builder.mutation({
			queryFn: toQueryFn<typeof api.createUser>(api.createUser),
			async onQueryStarted([newUser], { dispatch, queryFulfilled }) {
				try {
					let { data: createdUser } = await queryFulfilled;
					dispatch(
						adminApi.util.updateQueryData(
							"getUser",
							[createdUser.id, newUser.project_id],
							() => {
								return createdUser;
							},
						),
					);
					dispatch(
						adminApi.util.updateQueryData(
							"getUsers",
							[{ project: newUser.project_id }],
							(users) => {
								users.items.unshift({
									created_at: createdUser.created_at,
									email: createdUser.email,
									id: createdUser.id,
								});
							},
						),
					);
				} catch (err) {
					console.error("createUser: ", err);
				}
			},
		}),

		deleteUser: builder.mutation({
			queryFn: toQueryFn<typeof api.deleteUser>(api.deleteUser),
			async onQueryStarted([userId, project], { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					dispatch(
						adminApi.util.updateQueryData(
							"getUsers",
							[{ project }],
							(users) => {
								console.log(users.items);
								users.items = users.items.filter((user) => user.id !== userId);
							},
						),
					);
				} catch (err) {
					console.error("deleteUser: ", err);
				}
			},
			invalidatesTags: (res) =>
				res ? [{ type: "User", id: res.userId }, "User"] : [],
		}),

		disableUser: builder.mutation({
			queryFn: toQueryFn<typeof api.disableUser>(api.disableUser),
			async onQueryStarted(
				[userId, project, disabled],
				{ dispatch, queryFulfilled },
			) {
				try {
					await queryFulfilled;
					dispatch(
						adminApi.util.updateQueryData(
							"getUser",
							[userId, project],
							(user) => {
								user.state = disabled
									? UserState.Disabled
									: UserState.SetPassword;
							},
						),
					);
				} catch (err) {
					console.error("disableUser: ", err);
				}
			},
		}),

		verifyUserEmail: builder.mutation({
			queryFn: toQueryFn<typeof api.verifyUserEmail>(api.verifyUserEmail),
		}),

		requestPasswordReset: builder.mutation({
			queryFn: toQueryFn<typeof api.requestPasswordReset>(
				api.requestPasswordReset,
			),
		}),

		getEmailSettings: builder.query({
			queryFn: toQueryFn<typeof api.getEmailSettings>(api.getEmailSettings),
		}),

		getFlags: builder.query({
			queryFn: toQueryFn<typeof api.getFlags>(api.getFlags),
		}),

		setFlags: builder.mutation({
			queryFn: toQueryFn<typeof api.setFlags>(api.setFlags),
			async onQueryStarted([projectId, items], { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					dispatch(
						adminApi.util.updateQueryData("getFlags", [projectId], () => ({
							items,
						})),
					);
				} catch (err) {
					console.error("setFlags: ", err);
				}
			},
		}),

		getGoogleSettings: builder.query({
			queryFn: toQueryFn<typeof api.getGoogleSettings>(api.getGoogleSettings),
		}),

		saveGoogleSettings: builder.mutation({
			queryFn: toQueryFn<typeof api.saveGoogleSettings>(api.saveGoogleSettings),
			async onQueryStarted([projectId, config], { dispatch, queryFulfilled }) {
				try {
					await queryFulfilled;
					dispatch(
						adminApi.util.updateQueryData(
							"getGoogleSettings",
							[projectId],
							() => config,
						),
					);
				} catch (err) {
					console.error("saveGoogleSettings: ", err);
				}
			},
		}),
	}),
});

export let {
	useGetProjectsQuery,

	useGetUsersQuery,
	useGetUserQuery,
	useUpdateUserMutation,
	useCreateUserMutation,
	useDeleteUserMutation,
	useDisableUserMutation,
	useVerifyUserEmailMutation,
	useRequestPasswordResetMutation,

	useGetEmailSettingsQuery,
	useGetFlagsQuery,
	useSetFlagsMutation,
	useGetGoogleSettingsQuery,
	useSaveGoogleSettingsMutation,
} = adminApi;
