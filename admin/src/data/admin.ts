import Axios from 'axios'
import { useMounted } from 'utils/hook'

import {
	boson,
	bosonFamily,
	useSetBoson,
	useQuery,
	usePost,
} from '@biotic-ui/boson'

let axios = Axios.create({
	baseURL: '/'
})

type HasResponse = { id: null | string }

export function useProject() {
	return useQuery(projectId, async () => {
		let res = await axios.get<HasResponse>('/admin/__/project/has')
		return res.data.id
	})
}

export let projectId = boson<string | null>({
	key: 'project_id',
	defaultValue: null
})

type CreateProject = {
	id: string
}

export type UseCreateProject = {
	loading: boolean,
	id: null | string,
	error: boolean,
}


export type CreateAdminProject = {
	host: string;
}

export function useCreateProject() {
	let mounted = useMounted()
	let setProjectId = useSetBoson(projectId)

	return usePost(async (payload: CreateAdminProject) => {
		await axios
			.post<CreateProject>('/admin/__/project/create_admin', payload)
			.then(res => {
				if (mounted.current) {
					let { id } = res.data
					setProjectId(id)
				}
			})
	})
}


export type CreateAdmin = {
	email: string,
	password: string
}

export function createAdmin(data: CreateAdmin, project: string) {

	let headers = {
		'Vulpo-Project': project
	}

	return axios.post('/admin/__/create_once', data, { headers })
}


export let getLatesUrl = bosonFamily<[string], string>(id => {
	return {
		defaultValue: `/${id}/`
	}
})


