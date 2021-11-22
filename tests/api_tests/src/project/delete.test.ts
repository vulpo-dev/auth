import Http from '../utils/http'
import Db from '../utils/db'
import { generateAdminToken } from '../utils/admin'
import { makeGenerateAccessToken, makeTokenPayload } from '../utils/user'
import { makeCreateUser } from '../utils/passwordless'
import { admin } from '@seeds/data/projects'
import * as bcrypt from 'bcryptjs'
import { ApiError } from '@admin/error'
import { projectKeys, project } from '@seeds/data/projects'

let PROJECT_ID = 'd6db725a-9669-4d5b-8828-59376e1e8434'
let USER_ID = '6aea94cf-c113-4602-afd0-9d1a7e4daf42'
let EMAIL = 'api.test+delete_project@vulpo.dev'

let generateAccessToken = makeGenerateAccessToken({
	key: projectKeys.private_key,
	passphrase: 'password',
})
let tokenPayload = makeTokenPayload(USER_ID, PROJECT_ID)

let createUser = makeCreateUser(
	USER_ID,
	EMAIL,
	project.id
)

beforeAll(createUser)
beforeEach(createProject)

afterAll(async () => {
	await Db.query(`
		delete from projects
		 where id = $1 
	`, [PROJECT_ID])

	await Db.end()
})

describe("Delete Project", () => {
	test("admin can delete project", async () => {
		let token = generateAdminToken()

		let res = await Http
			.post('/project/delete', { project: PROJECT_ID }, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(res.status).toEqual(200)

		let entry = await getProject()
		expect(entry).toBe(null)
	})

	test("fails for non admin user", async () => {
		let token = generateAccessToken({
			payload: tokenPayload()
		})

		let res = await Http
			.post('/project/delete', { project: PROJECT_ID }, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(res.status).toEqual(401)

		let entry = await getProject()
		expect(entry).toBeTruthy()
	})
})


async function createProject() {
	await Db.query(`
		delete from projects
		 where id = $1
	`, [PROJECT_ID])

	await Db.query(`
		insert into projects(id)
		values($1)
	`, [PROJECT_ID])
}

async function getProject() {
	let { rows: projects } = await Db.query(`
		select id
		  from projects
		 where id = $1
	`, [PROJECT_ID])


	return projects[0] ?? null
}