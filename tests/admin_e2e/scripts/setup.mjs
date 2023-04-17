import { signIn, setSessionState } from '@vulpo-dev/test-helper'

export default async function setUp() {
	let session = await signIn('http://localhost:8000', 'f4db2736-ce01-40d7-9a3b-94e5d2a648c8', 'michael@riezler.co', 'password')
	setSessionState({
		sessions: [session],
		active_user: session.session.id,
		file: 'sessions.json'
	})
}