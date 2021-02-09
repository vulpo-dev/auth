import {
	useEffect,
	useCallback,
	createContext,
	useContext
} from 'react'
import { useHttp, getError } from 'data/http'
import { atom, useRecoilState, SetterOrUpdater, useSetRecoilState } from 'recoil'
import { AuthClient } from '@riezler/auth-sdk'

export type PartialProject = {
	id: string;
	name: string;
	domain: string;
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

	return useCallback(async (name: string, domain: string): Promise<PartialProject> => {
		try {
			let { data } = await http
				.post<[string]>('/admin/__/project/create', { name, domain })

			let project: PartialProject = {
				id: data[0],
				name,
				domain
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

export let ProjectCtx = createContext<PartialProject | undefined>(undefined)

export function useProject(): PartialProject {
	return useContext(ProjectCtx)!
}