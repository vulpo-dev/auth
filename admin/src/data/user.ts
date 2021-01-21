import { useEffect } from 'react'
import { useHttp } from 'data/http'

export function useUsers(project?: string) {
	let http = useHttp()

	useEffect(() => {

		if (!project) {
			return
		}

		http.get('/user/list', {
			params: {
				order_by: 'created_at',
				sort: 'asc',
				offset: 0,
				limit: 20,
				project: project
			}
		})
		.then(res => {
			console.log(res)
		})
	}, [project, http])
}