import { removeByEmailType } from '../tests/utils/user'
import { deleteProjects } from '../tests/utils/project'

export default async function globalTeardown() {
	await removeByEmailType('ui.e2e%vulpo.dev')
	await deleteProjects()
}