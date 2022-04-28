import Http from '../utils/http'
import Db from '../utils/db'
import { generateAdminToken } from '../utils/admin'
import { createUser, createTokenPayload } from '../utils/user'
import { generateAccessToken } from '../utils/auth'
import { admin } from '@seeds/data/projects'
import { projectKeys } from '@seeds/data/projects'

import { v4 as uuid } from 'uuid'

let key = {
	key: projectKeys.private_key,
	passphrase: 'password',
}

afterAll(() =>  Db.end())

describe("Delete Project", () => {
	test("admin can delete project", async () => {
		let project = await createProject()
		let token = generateAdminToken()

		let res = await Http
			.post('/project/delete', { project: project.id }, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Vulpo-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(res.status).toEqual(200)

		let entry = await getProject(project)
		expect(entry).toBe(null)
	})

	test("fails for non admin user", async () => {
		let project = await createProject()
		let user = await createUser({ project: project.id })
		let payload = createTokenPayload(user.id, user.project)
		let accessToken = generateAccessToken({ key, payload })

		let res = await Http
			.post('/project/delete', { project: project.id }, {
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Vulpo-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(res.status).toEqual(401)

		let entry = await getProject(project)
		expect(entry).toBeTruthy()
	})
})


async function createProject() {
	let id = uuid()
	
	await Db.query(`
		insert into projects(id)
		values($1)
	`, [id])

	return { id }
}

async function getProject({ id }: { id: string }) {
	let { rows: projects } = await Db.query(`
		select id
		  from projects
		 where id = $1
	`, [id])


	return projects[0] ?? null
}