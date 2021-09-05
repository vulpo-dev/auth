import { useState, useCallback } from 'react'
import { useHttp } from 'data/http'
import { ApiError, getErrorCode } from 'error'
import { bosonFamily, useQuery } from '@biotic-ui/boson'

export { useUsers } from './list'
export { useUser } from './get'
export type { Users, User } from './types'

import { User, UpdateUser } from './types'

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
	let [loading, setLoading] = useState<boolean>(false)
	let [error, setError] = useState<ApiError | null>(null)

	let run = useCallback(async (userId: string) => {
		setError(null)
		setLoading(true)
		
		try {
			await http.post(`/user/admin/delete_account/${userId}`)
		} catch(err) {
			setError(getErrorCode(err))
		} finally {
			setLoading(false)
		}
	}, [http, setLoading, setError])

	return { run, error, loading }
}


export function useVerifyEmail(project_id: string) {
	let http = useHttp()
	let [loading, setLoading] = useState<boolean>(false)
	let [error, setError] = useState<ApiError | null>(null)

	let run = useCallback(async (user_id: string) => {
		setError(null)
		setLoading(true)
		
		try {
			await http.post(`/user/send_email_verification`, { user_id, project_id })
		} catch(err) {
			setError(getErrorCode(err))
		} finally {
			setLoading(false)
		}
	}, [http, project_id, setLoading, setError])

	return { run, error, loading }
}

export function useDisableUser(project: string) {
	let http = useHttp()
	let [loading, setLoading] = useState<boolean>(false)
	let [error, setError] = useState<ApiError | null>(null)

	let run = useCallback(async (user: string, disabled: boolean) => {
		setError(null)
		setLoading(true)
		
		try {
			await http.post(`/user/disable`, { user, project, disabled })
		} catch(err) {
			setError(getErrorCode(err))
		} finally {
			setLoading(false)
		}
	}, [http, project, setLoading, setError])

	return { run, error, loading }
}

export function useUpdateUser(projectId: string) {
	let http = useHttp()
	let [loading, setLoading] = useState<boolean>(false)
	let [error, setError] = useState<ApiError | null>(null)

	let run = useCallback(async (user: User) => {
		setError(null)
		setLoading(true)

		let payload: UpdateUser = {
			display_name: user.display_name,
			email: user.email,
			traits: user.traits,
			data: user.data,
		}
		
		try {
			await http.post('/user/admin/update/', payload, {
				params: {
					user_id: user.id,
					project_id: projectId,
				}
			})
		} catch(err) {
			setError(getErrorCode(err))
		} finally {
			setLoading(false)
		}
	}, [http, setLoading, setError])

	return { run, error, loading }
}