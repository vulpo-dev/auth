import { useEffect, useState } from 'react'
import { useHttp, CancelToken } from 'data/http'
import { ApiError, getErrorCode } from 'error'
import { bosonFamily, useBoson } from '@biotic-ui/boson'
import { PartialUser, PartialUserResponse, partialUserFromResponse } from 'data/user/types'
import Axios from 'axios'

type Response = {
	items: Array<PartialUserResponse>;
}

type UsersState = {
	items?: Array<PartialUser> | null;
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
					return partialUserFromResponse(user)
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

				if (Axios.isCancel(err)) {
					return
				}

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