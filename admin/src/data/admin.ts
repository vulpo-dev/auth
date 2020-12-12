import { useState, useEffect } from 'react'
import Axios from 'axios'
import { useMounted } from 'utils/hook'
import { atom, useSetRecoilState, useRecoilState } from 'recoil'

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
	let [state, setState] = useRecoilState(projectIdAtom)

	useEffect(() => {
		axios.get<HasResponse>('/admin/__/project/has').then((res) => {
			console.log(res.data)
			if (mounted.current) {
				setState(res.data.id)
				setLoading(false)
			}
		})
	}, [setState, setLoading, mounted])

	return { project: loading ? undefined : state }
}

export let projectIdAtom = atom<string | null>({
	key: 'project_id',
	default: null
})

type CreateProject = {
	id: string
}

export type UseCreateProject = {
	loading: boolean,
	id: null | string
}

export function useCreateProject(): UseCreateProject {
	let mounted = useMounted()
	let [state, setState] = useState<UseCreateProject>({
		loading: true,
		id: null
	})

	let setProjectId = useSetRecoilState(projectIdAtom)

	useEffect(() => {
		axios.post<CreateProject>('/admin/__/project/create').then(res => {
			if (mounted.current) {
				let { id } = res.data
				setState({ id, loading: false })
				setProjectId(id)
			}
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