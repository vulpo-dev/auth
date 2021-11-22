import Db from '../src/utils/db'


export default async function globalTeardown() {
	await Db.query(`
		delete from users
		 where email like 'api.test+%vulpo.dev'
	`)

	await Db.end()
}