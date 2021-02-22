import { useState, useEffect } from 'react'
import Axios from 'axios'
import { useMounted } from 'utils/hook'

import {
	boson,
	bosonFamily,
	useBoson,
	useSetBoson,
	useBosonValue,
} from '@biotic-ui/boson'

let axios = Axios.create({
	baseURL: '/'
})

type HasResponse = { id: null | string }

type UseProject = {
	project: string | null | undefined
}

export function useProject(): UseProject {
	let mounted = useMounted()
	let [loading, setLoading] = useState(true)
	let [state, setState] = useBoson(projectIdAtom)

	useEffect(() => {
		axios.get<HasResponse>('/admin/__/project/has').then((res) => {
			if (mounted.current) {
				setState(res.data.id)
				setLoading(false)
			}
		})
	}, [setState, setLoading, mounted])

	return { project: loading ? undefined : state }
}

export let projectIdAtom = boson<string | null>({
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

export function useCreateProject(): UseCreateProject {
	let mounted = useMounted()
	let [state, setState] = useState<UseCreateProject>({
		loading: true,
		id: null,
		error: false,
	})

	let setProjectId = useSetBoson(projectIdAtom)

	useEffect(() => {
		axios.post<CreateProject>('/admin/__/project/create_admin')
			.then(res => {
				if (mounted.current) {
					let { id } = res.data
					setState({ id, loading: false, error: false })
					setProjectId(id)
				}
			})
			.catch(() => {
				setState({ id: null, loading: false, error: true })
			})
	}, [mounted, setProjectId])

	return state
}


export type CreateAdmin = {
	email: string,
	password: string
}

export function createAdmin(data: CreateAdmin, project: string) {

	let headers = {
		'Bento-Project': project
	}

	return axios.post('/admin/__/create_once', data, { headers })
}


export let getLatesUrl = bosonFamily<[string], string>(id => {
	return {
		key: 'latest_url',
		defaultValue: `/${id}/`
	}
})


