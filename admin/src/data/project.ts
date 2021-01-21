import { useEffect, useCallback } from 'react'
import { useHttp, getError } from 'data/http'
import { atom, useRecoilState, SetterOrUpdater, useSetRecoilState } from 'recoil'
import { AuthClient } from '@riezler/auth-sdk'

export type PartialProject = {
	id: string,
	name: string,
}

type ProjectList = Array<PartialProject>

let projectsAtom = atom<ProjectList | undefined>({
	key: 'projects',
	default: undefined
})

type UseProjects = [
	ProjectList | undefined,
	SetterOrUpdater<ProjectList | undefined>
]

export function useProjects(): UseProjects {
	let http = useHttp()
	let [projects, setProjects] = useRecoilState(projectsAtom)

	useEffect(() => {
		http.get<ProjectList>('/admin/__/project/list')
			.then(async res => {
				setProjects(res.data)
			})
			.catch(err => console.log(err))
	}, [http, setProjects])

	return [projects, setProjects]
}

export function useCreateProject() {
	let http = useHttp()
	let setProjects = useSetRecoilState(projectsAtom)

	return useCallback(async (name: string): Promise<PartialProject> => {
		try {
			let { data } = await http
				.post<[string]>('/admin/__/project/create', { name })

			let project: PartialProject = {
				id: data[0],
				name: name,
			}

			setProjects((projects = []) => {
				return [...projects, project]
			})

			return project

		} catch (err) {
			throw getError(err)
		}
	}, [http, setProjects])
}