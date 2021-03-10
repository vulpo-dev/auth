import { useEffect, useState, useCallback } from 'react'
import { useHttp, CancelToken } from 'data/http'
import { ApiError, getErrorCode } from 'error'
import { bosonFamily, useBoson } from '@biotic-ui/boson'
import { useMounted } from '@biotic-ui/std'

enum Provider {
	Email
}

function providerFromRequest(str: string) {
	switch(str) {
		case 'email':
		default:
			return Provider.Email
	}
}

export type User = {
	created_at: Date;
	email: string;
	email_verified: boolean;
	id: string;
	provider_id: Provider;
	disabled: boolean;
}

export type Users = Array<User>

type UserResponse = {
	created_at: string;
	email: string;
	email_verified: boolean;
	id: string;
	provider_id: string;
	disabled: boolean;
}

function userFromResponse(user: UserResponse): User {
	return {
		...user,
		created_at: new Date(user.created_at),
		provider_id: providerFromRequest(user.provider_id),
	}
}

type Response = {
	items: Array<UserResponse>;
}

type UsersState = {
	items?: Array<User> | null;
	loading: boolean;
	error: null | ApiError;
}

let DefaultState: UsersState = {
	items: undefined,
	loading: true,
	error: null,
}

let usersFamily = bosonFamily<[Filter], UsersState>(filter => {
	return {
		key: 'users',
		defaultValue: DefaultState,
	}
}, filterToKey)

type Filter = {
	project: string;
	orderBy?: 'created_at' | 'email';
	sort?: 'asc' | 'desc';
	offset?: number;
	limit?: number;
}

function filterToKey(f: Filter) {
	return `${f.project}:${f.orderBy}:${f.sort}:${f.offset}:${f.limit}`
}

type Reload = {
	reload: () => void;
}

export function useUsers({
	project,
	orderBy = 'created_at',
	sort = 'desc',
	offset = 0,
	limit = 50
}: Filter): UsersState & Reload {
	let mounted = useMounted()
	let http = useHttp()
	let [shouldReload, setReload] = useState<boolean>(false)

	let key = {
		project,
		orderBy,
		sort,
		offset,
		limit,
	}

	let [state, setState] = useBoson(usersFamily(key))
	
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
			order_by: orderBy,
			sort: sort,
			offset: offset,
			limit: limit,
			project: project
		}

		let config = {
			params,
			cancelToken: source.token,
		}

		http
			.get<Response>('/user/list', config)
			.then(({ data }) => {

				let users = data.items.map(user => {
					return userFromResponse(user)
				})

				setState(state => {
					return {
						...state,
						loading: false,
						items: users,
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
	}, [project, orderBy, sort, offset, limit, http, setState, shouldReload])

	return {
		...state,
		reload: () => setReload(state => !state)
	}
}


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
		key: `toal_users:${id}`,
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
			await http.post(`/user/delete_account/${userId}`)
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