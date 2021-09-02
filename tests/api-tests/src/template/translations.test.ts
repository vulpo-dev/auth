import Http from '../utils/http'
import Db from '../utils/db'
import { generateAdminToken } from '../utils/admin'
import { PROJECT_ID } from '../utils/env'
import TranslationSchema from '../utils/schema/translations'
import { Languages } from '@admin/data/languages'
import { admin } from '@seeds/data/projects'

const TEMPLATE_ID = '88cb6976-9acd-4c8a-9f0f-4083f1925b9a'
const codes = Object.keys(Languages).slice(0, 5)

const TEMPLATE = `<h1>{{t.headline}}</h1>
<p>{{t.text}}</p>

{{> button label=t.label href=ctx.href }}

<p>
	<a href="{{ctx.href}}" target="_blank" >
		{{ ctx.href }}
	</a>
</p>

<p>{{t.expire}}</p>`

const TRANSLATION = {
	"subject": "Confirm Email Change",
	"headline": "Confirm Email Change",
	"label": "Confirm Email Change",
	"text": "Click on the link below to verify your changed email address from {{ctx.old}} to {{ctx.new}}.",
	"expire": "The link is valid for <span class=\"bold\">{{ctx.expire_in}} minutes</span> and can only be used once"
}

beforeAll(async () => {
	let translations = codes.map(language => {
		return {
			content: TRANSLATION,
			language,
			template_id: TEMPLATE_ID,
		}
	})

	await Db.query(`
		insert into templates(id, name, body, of_type, project_id)
		values($1, 'test_translations', $2, 'test', $3)
	`, [TEMPLATE_ID, TEMPLATE, PROJECT_ID])

	await Db.query(`
		insert into template_translations(template_id, language, content)
		select template_id, language, content
		  from json_to_recordset($1)
		    as x(template_id uuid, language text, content jsonb)
	`, [JSON.stringify(translations)])
})


afterAll(() => {
	return Db.query(`
		delete from templates
		 where id = $1
	`, [TEMPLATE_ID])
})
afterAll(() => Db.end())

describe("Translations", () => {
	test("get all project translations", async () => {
		let token = generateAdminToken()

		let res = await Http
			.get('/template/translations', {
				params: {
					project: PROJECT_ID,
					template: 'test_translations' 
				},
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(res.status).toBe(200)

		let data = TranslationSchema.validate(res.data);
		expect(data).toBe(true)

		let keys = Object.keys(res.data)
		codes.forEach(lang => {
			let key = keys.find(k => k === lang)
			expect(key).toEqual(lang)
		})
		
		expect(codes.every(lang => keys.includes(lang))).toBe(true)
		expect(keys.every(lang => codes.includes(lang))).toBe(true)
	})

	test("returns forbidden for invalid token", async () => {
		let token = generateAdminToken(true)

		let res = await Http
			.get('/template/translations', {
				params: {
					project: PROJECT_ID,
					template: 'test_translations' 
				},
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(res.status).toBe(403)
	})


	test("can create translation", async () => {
		let token = generateAdminToken()

		let payload = {
			project: PROJECT_ID,
			template: 'test_translations' ,
			language: 'create_empty',
			content: TRANSLATION,
		}

		let create = await Http
			.post('/template/translations/set', payload, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(create.status).toBe(200)

		let res = await Http
			.get('/template/translations', {
				params: {
					project: PROJECT_ID,
					template: 'test_translations' 
				},
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(res.data.create_empty).toBeTruthy()
	})

	test("can update translation", async () => {
		let token = generateAdminToken()

		let change = {
			"subject": "Changed",
			"headline": "Changed",
			"label": "Changed",
			"text": "Click on the link below to verify your changed email address from {{ctx.old}} to {{ctx.new}}.",
			"expire": "The link is valid for <span class=\"bold\">{{ctx.expire_in}} minutes</span> and can only be used once"
		}

		let payload = {
			project: PROJECT_ID,
			template: 'test_translations' ,
			language: codes[0],
			content: change,
		}

		let create = await Http
			.post('/template/translations/set', payload, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(create.status).toBe(200)

		let res = await Http
			.get('/template/translations', {
				params: {
					project: PROJECT_ID,
					template: 'test_translations' 
				},
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(res.data[payload.language]).toMatchObject(change)
	})

	test("can delete translation", async () => {

		let token = generateAdminToken()

		let payload = {
			project: PROJECT_ID,
			template: 'test_translations' ,
			language: 'delete',
			content: TRANSLATION,
		}

		await Http
			.post('/template/translations/set', payload, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})

		let deletePayload = {
			project: PROJECT_ID,
			template: 'test_translations',
			language:  'delete'
		}

		let create = await Http
			.post('/template/translations/delete', deletePayload, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Bento-Project': admin.id,
				}
			})
			.catch(err => err.response)

		expect(create.status).toBe(200)

		let { rows } = await Db.query(`
			select *
			  from template_translations
			 where template_id = $1
			   and language = 'delete'
		`, [TEMPLATE_ID])

		expect(rows.length).toBe(0)

	})
})