import { useEffect } from 'react'
import { useHttp } from 'data/http'
import { atom, useRecoilState, SetterOrUpdater } from 'recoil'
import { AuthClient } from '@riezler/auth-sdk'

type PartialProject = {
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
	}, [http, setProjects])

	return [projects, setProjects]
}