import { Auth } from '@vulpo-dev/auth-sdk'

let params = new URLSearchParams(window.location.search)
let project = params.get('project') ?? 'ae16cc4a-33be-4b4e-a408-e67018fe453b'

export default Auth.create({
	project,
	baseURL: 'http://127.0.0.1:8000/api'
})
