import { useHttp } from 'data/http'
import { bosonFamily, useQuery } from '@biotic-ui/boson'
import { PartialUser, PartialUserResponse, partialUserFromResponse } from 'data/user/types'

type Response = {
	items: Array<PartialUserResponse>;
}

let usersFamily = bosonFamily<[Filter], Array<PartialUser> | null>(() => {
	return {
		defaultValue: null,
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

export function useUsers({
	project,
	orderBy = 'created_at',
	sort = 'desc',
	offset = 0,
	limit = 50
}: Filter) {
	let http = useHttp()

	let key = {
		project,
		orderBy,
		sort,
		offset,
		limit,
	}

	return useQuery(usersFamily(key), async () => {
		let params = {
			order_by: orderBy,
			sort: sort,
			offset: offset,
			limit: limit,
			project: project
		}

		let res = await http.get<Response>('/user/list', { params })

		return res.data.items.map(user => {
			return partialUserFromResponse(user)
		})
	})
}