import express, { Response, Request } from 'express'
import bodyParser from 'body-parser'
import { v4 as uuid } from 'uuid'

let app = express()

app.use(bodyParser.json())

app.post('/password/sign_in', (req: Request, res: Response) => {
	let { email, password } = req.body;

	if (email === 'ok') {
		return res.json({
			access_token: "",
			created: false,
			user_id: uuid(),
			expire_at: (new Date()).toISOString(),
			session: uuid(),
		})
	}

	if (email === 'internal_error') {
		return res
			.status(500)
			.json({ code: 'internal_error' })
	}
})

app.listen(8080, () => {
	console.log('Server is running on port: 8080')
	console.log(`ENDPOINTS:
    POST /password/sign_in
	`)
})
