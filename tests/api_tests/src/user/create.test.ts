import Http from '../utils/http'
import Db from '../utils/db'
import { generateAdminToken } from '../utils/admin'
import { PROJECT_ID } from '../utils/env'
import { admin } from '@seeds/data/projects'
import * as bcrypt from 'bcryptjs'
import { ApiError } from '@admin/error'

import * as uuid from 'uuid';
import { ErrorCode } from '@sdk-js/error'

let EMAIL = 'api.test+create_user@vulpo.dev'
let email = () => `api.test+${uuid.v4()}@vulpo.dev`

async function removeUser() {
	await Db.query(`
		delete from users
		 where email = $1
	`, [EMAIL])
}

beforeEach(removeUser)
afterAll(() => Db.end())

describe("Create User", () => {
	test("creates passwordless user", async () => {
		let token = generateAdminToken()

		let user = {
			email: EMAIL,
			project_id: PROJECT_ID,
			display_name: 'display_name',
			data: {
				fuu: 1,
				bar: 'baz',
			},
			provider_id: 'link',
		}

		let res = await Http
			.post('/admin/__/create_user', user, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(res.status).toEqual(200)
		expect(uuid.validate(res.data[0])).toBeTruthy()
		expect(uuid.version(res.data[0])).toEqual(4)

		let { rows } = await Db.query(`
			select id
			     , email
			     , display_name
			     , data
			     , provider_id
			     , state
			  from users
			 where email = $1 
		`, [EMAIL])

		expect(rows.length).toEqual(1)

		let createdUser = rows[0]

		expect(createdUser).toMatchObject({
			id: res.data[0],
			email: EMAIL,
			display_name: user.display_name,
			provider_id: user.provider_id,
			state: 'Active',
			data: user.data,
		})
	})

	test("creates password user", async () => {
		let EMAIL = email()
		let token = generateAdminToken()

		let user = {
			email: EMAIL,
			password: 'password',
			project_id: PROJECT_ID,
			display_name: 'display_name',
			data: {
				fuu: 1,
				bar: 'baz',
			},
			provider_id: 'password',
		}

		let res = await Http
			.post('/admin/__/create_user', user, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(res.status).toEqual(200)
		expect(uuid.validate(res.data[0])).toBeTruthy()
		expect(uuid.version(res.data[0])).toEqual(4)

		let { rows } = await Db.query(`
			select users.id
			     , users.email
			     , passwords.hash as "password"
			     , users.display_name
			     , users.data
			     , users.provider_id
			     , users.state
			  from users
			  left join passwords on passwords.user_id = users.id
			 where email = $1 
		`, [EMAIL])

		expect(rows.length).toEqual(1)

		let createdUser = rows[0]

		expect(createdUser).toMatchObject({
			id: res.data[0],
			email: EMAIL,
			display_name: user.display_name,
			provider_id: user.provider_id,
			state: 'SetPassword',
			data: user.data,
		})

		expect(bcrypt.compareSync(user.password, createdUser.password)).toBeTruthy()
	})

	test("fails when password is too short", async () => {
		let token = generateAdminToken()

		let user = {
			email: EMAIL,
			password: '1234567',
			project_id: PROJECT_ID,
			display_name: 'display_name',
			data: {
				fuu: 1,
				bar: 'baz',
			},
			provider_id: 'password',
		}

		let res = await Http
			.post('/admin/__/create_user', user, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.PasswordMinLength)
	})

	test("fails when password is empty", async () => {
		let token = generateAdminToken()

		let user = {
			email: EMAIL,
			project_id: PROJECT_ID,
			display_name: 'display_name',
			data: {
				fuu: 1,
				bar: 'baz',
			},
			provider_id: 'password',
		}

		let res = await Http
			.post('/admin/__/create_user', user, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.PasswordMinLength)
	})

	test("fails when password is too long", async () => {
		let token = generateAdminToken()

		let user = {
			email: EMAIL,
			password: 'passwordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpassword',
			project_id: PROJECT_ID,
			display_name: 'display_name',
			data: {
				fuu: 1,
				bar: 'baz',
			},
			provider_id: 'password',
		}

		let res = await Http
			.post('/admin/__/create_user', user, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.PasswordMaxLength)
	})

	test("fails when user exists", async () => {
		let token = generateAdminToken()

		let user = {
			email: EMAIL,
			project_id: PROJECT_ID,
			provider_id: 'link',
		}

		await Http
			.post('/admin/__/create_user', user, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		let res = await Http
			.post('/admin/__/create_user', user, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(res.status).toEqual(409)
		expect(res.data.code).toEqual(ApiError.UserExists)
	})

	test("fails when project does not exist", async () => {
		let token = generateAdminToken()

		let user = {
			email: EMAIL,
			project_id: 'c72ec4b8-9836-4070-84c0-a17680cb0f91',
			provider_id: 'link',
		}

		await Http
			.post('/admin/__/create_user', user, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		let res = await Http
			.post('/admin/__/create_user', user, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(res.status).toEqual(400)
		expect(res.data.code).toEqual(ApiError.UserInvalidProject)
	})
})