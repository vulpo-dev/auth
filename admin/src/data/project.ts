import {
	createContext,
	useContext
} from 'react'

import { useHttp } from 'data/http'

import {
	boson,
	useSetBoson,
	useQuery,
	usePost,
} from '@biotic-ui/boson'

import { ApiError } from 'error'

export type PartialProject = {
	id: string;
	name: string;
	domain: string;
}

type ProjectList = Array<PartialProject>

let projectsAtom = boson<ProjectList | undefined>({
	key: 'projects',
	defaultValue: undefined
})


export function useProjects() {
	let http = useHttp()

	return useQuery(projectsAtom, async () => {
		let res = await http.get<ProjectList>('/admin/__/project/list')
		return res.data
	})
}

export function useCreateProject() {
	let http = useHttp()
	let setProjects = useSetBoson(projectsAtom)
	return usePost<PartialProject, ApiError>(async (name: string, domain: string) => {
		let { data } = await http
			.post<[string]>('/admin/__/project/create', { name, domain })
			.catch(err => Promise.reject(err))

		let project: PartialProject = {
			id: data[0],
			name,
			domain
		}

		setProjects((projects = []) => {
			return [...projects, project]
		})

		return project
	})
}

export let ProjectCtx = createContext<PartialProject | undefined>(undefined)

export function useProject(): [PartialProject, (p: PartialProject) => void] {
	let current = useContext(ProjectCtx)
	let [{ data: projects }, actions] = useProjects()
	let project = projects?.find(p => p.id === current?.id)

	let set = (p: PartialProject) => {
		actions.set((state = []) => {
			let index = state.findIndex(item => item.id === p.id)

			if (index === -1) {
				return state
			}

			return [
				...state.slice(0, index),
				p,
				...state.slice(index + 1),
			]
		})
	}

	return [project!, set]
}