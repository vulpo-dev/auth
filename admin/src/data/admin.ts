import { useState, useEffect } from 'react'
import Axios from 'axios'
import { useMounted } from 'utils/hook'
import { atom, useSetRecoilState } from 'recoil'

let axios = Axios.create({
	baseURL: process.env.REACT_APP_SERVER
})

type HasResponse = { id: null | string }

type UseProject = {
	project: string | null | undefined
}

export function useProject(): UseProject {
	let mounted = useMounted()
	let [state, setState] = useState<UseProject>({ project: undefined })

	useEffect(() => {
		axios.get<HasResponse>('/admin/__/project/has').then((res) => {
			if (mounted.current) {
				setState({ project: res.data.id })
			}
		})
	}, [setState, mounted])

	return state
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
			console.log(mounted, res.data)
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