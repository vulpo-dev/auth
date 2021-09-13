import { useHttp } from 'data/http'
import { ApiError, getErrorCode } from 'error'
import { bosonFamily, useQuery, usePost } from '@biotic-ui/boson'

export { useUsers } from './list'
export { useUser } from './get'
export type { Users, User } from './types'
import { User, UpdateUser, NewUser } from './types'

type TotalUsersResponse = {
	total_users: number;
}

let userTotalFamily = bosonFamily<[string], number | null>(() => {
	return {
		defaultValue: null
	}
})

export function useTotalUsers(project: string) {
	let http = useHttp()
	return useQuery(userTotalFamily(project), async () => {
		let res = await http.get<TotalUsersResponse>('/user/total', {
			params: {
				project
			}
		})

		return res.data.total_users
	})
}

export function useDeleteUser() {
	let http = useHttp()
	return usePost<void, ApiError>(async (userId: string) => {
		await http
			.post(`/user/admin/delete_account/${userId}`)
			.catch(err => Promise.reject(getErrorCode(err)))
	})
}


export function useVerifyEmail(project_id: string) {
	let http = useHttp()
	return usePost<void, ApiError>(async (userId: string) => {
		await http
			.post(`/user/send_email_verification`, {
				user_id: userId,
				project_id
			})
			.catch(err => Promise.reject(getErrorCode(err)))
	})
}

export function useDisableUser(project: string) {
	let http = useHttp()
	return usePost<void, ApiError>(async (user: string, disabled: boolean) => {
		await http
			.post(`/user/disable`, { user, project, disabled })
			.catch(err => Promise.reject(getErrorCode(err)))
	})
}

export function useUpdateUser(projectId: string) {
	let http = useHttp()
	return usePost<void, ApiError>(async (user: User) => {
		let payload: UpdateUser = {
			display_name: user.display_name,
			email: user.email,
			traits: user.traits,
			data: user.data,
		}

		await http
			.post('/user/admin/update/', payload, {
				params: {
					user_id: user.id,
					project_id: projectId,
				}
			})
			.catch(err => Promise.reject(getErrorCode(err)))
	})
}

export function useCreateUser(project_id: string) {
	let http = useHttp()
	return usePost<void, ApiError>(async (user: NewUser, provider_id: 'link' | 'password') => {
		await http
			.post('/admin/__/create_user', { ...user, project_id, provider_id })
			.catch(err => Promise.reject(getErrorCode(err)))
	})
}