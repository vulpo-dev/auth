import { removeByEmailType } from '../tests/utils/user'

export default async function globalTeardown() {
	await removeByEmailType('ui.e2e%vulpo.dev')
}