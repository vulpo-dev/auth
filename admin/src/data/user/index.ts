import { useEffect, useState, useCallback } from 'react'
import { useHttp, CancelToken } from 'data/http'
import { ApiError, getErrorCode } from 'error'
import { bosonFamily, useBoson } from '@biotic-ui/boson'
import { useMounted } from '@biotic-ui/std'

export { useUsers } from './list'
export { useUser } from './get'
export type { Users, User } from './types'

import { User, UpdateUser } from './types'

type TotalUsersResponse = {
	total_users: number;
}

type TotalState = {
	value?: number | null;
	loading: boolean;
	error: null | ApiError; 
}

let userTotalFamily = bosonFamily<[string], TotalState>(id => {
	return {
		defaultValue: {
			value: undefined,
			loading: true,
			error: null,
		}
	}
})

export function useTotalUsers(project: string): TotalState {
	let mounted = useMounted()
	let http = useHttp()
	let [state, setState] = useBoson(userTotalFamily(project))

	useEffect(() => {
		setState(state => {
			return {
				...state,
				loading: true,
				error: null,
			}
		})

		let source = CancelToken.source()

		let params = {
			project
		}

		let config = {
			params,
			cancelToken: source.token,
		}

		http
			.get<TotalUsersResponse>('/user/total', config)
			.then(res => {
				setState(state => {
					return {
						...state,
						loading: false,
						value: res.data.total_users,
					} 
				})
			})
			.catch(err => {
				setState(state => {
					return {
						...state,
						loading: false,
						error: getErrorCode(err),
					}
				})
			})

		return () => {
			source.cancel()
		}
	}, [project, http, setState])

	return state
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