import { useEffect, useState } from 'react'
import { useHttp, HttpError, CancelToken, getError } from 'data/http'
import { atomFamily, useRecoilState } from 'recoil'
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
	provider_id: Provider
}

export type Users = Array<User>

type UserResponse = {
	created_at: string;
	email: string;
	email_verified: boolean;
	id: string;
	provider_id: string;
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
	error: null | HttpError;
}

let DefaultState: UsersState = {
	items: undefined,
	loading: true,
	error: null,
}

let usersFamily = atomFamily<UsersState, Filter>({
	key: 'users',
	default: DefaultState
})

type Filter = {
	project: string;
	orderBy?: 'created_at' | 'email';
	sort?: 'asc' | 'desc';
	offset?: number;
	limit?: number;
}

type Reload = {
	reload: () => void;
}

export function useUsers({
	project,
	orderBy = 'created_at',
	sort = 'asc',
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

	let [state, setState] = useRecoilState(usersFamily(key))
	
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
						error: getError(err),
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
	error: null | HttpError; 
}

let userTotalFamily = atomFamily<TotalState, string>({
	key: 'toal_users',
	default: {
		value: undefined,
		loading: true,
		error: null,
	}
})

export function useTotalUsers(project: string): TotalState {
	let mounted = useMounted()
	let http = useHttp()
	let [state, setState] = useRecoilState(userTotalFamily(project))

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
						error: getError(err),
					}
				})
			})

		return () => {
			source.cancel()
		}
	}, [project, http, setState])

	return state
}