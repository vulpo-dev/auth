import { createContext, useContext } from 'react'
import { useHttp } from 'data/http'

import {
	boson,
	bosonFamily,
	useSetBoson,
	useQuery,
	usePost,
} from '@biotic-ui/boson'
import { ApiError, getErrorCode } from 'error'

export type PartialProject = {
	id: string;
	name: string;
	domain: string;
	is_admin: boolean; 
}

type ProjectList = Array<PartialProject>

export let projectsAtom = boson<ProjectList | undefined>({
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
			domain,
			is_admin: false,
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

export function useDeleteProject(project: string) {
	let http = useHttp()

	return usePost<void, ApiError>(async () => {
		let payload = { project }

		await http
			.post('project/delete', payload)
			.catch(err => Promise.reject(getErrorCode(err)))
	})
}

type PublicKey = {
	id: string;
	key: string;
}

let publicKeysFamily = bosonFamily<[string], Array<PublicKey>>(() => {
	return {
		defaultValue: []
	}
})

export function usePublicKeys(project: string) {
	let http = useHttp()
	let publicKeys = publicKeysFamily(project)
	return useQuery(publicKeys, async () => {
		let res = await http.get<Array<PublicKey>>('/keys/public', {
			params: { project }
		})
		return res.data
	}) 
}