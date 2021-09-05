import { User } from 'data/user/types'
import { bosonFamily, useQuery } from '@biotic-ui/boson'
import { useHttp } from 'data/http'

type UserState
	= User
	| undefined
	| null 

let userFamily = bosonFamily<[string], UserState>(() => {
	return {
		defaultValue: undefined
	}
})

export function useUser(userId: string | null, projectId: string) {
	let http = useHttp()

	return useQuery(userFamily(userId ?? ''), async () => {
		if (userId === null) {
			return
		}

		let res = await http.get<User | null>('/user/get_by_id', {
			params: {
				user: userId,
				project: projectId
			}
		})

		return res.data
	})
}