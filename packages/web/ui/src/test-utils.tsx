import { render as testRender } from '@testing-library/react'
import { MockAuthClient } from '@vulpo-dev/auth-sdk/lib/mock_client'
import { Auth } from '@vulpo-dev/auth-react'
import { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

export function renderWithClient(route: string, component: ReactNode) {
	let client = new MockAuthClient()

	testRender(
		<MemoryRouter initialEntries={[route]}>
			<Auth.Provider value={client}>
				{ component }
			</Auth.Provider>
		</MemoryRouter>
	)

	return client
}

export function wait(timeout: number = 2000) {
	return new Promise(resolve => {
		setTimeout(resolve, timeout)
	})
}
