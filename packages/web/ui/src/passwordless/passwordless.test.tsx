import { screen, fireEvent, waitFor } from '@testing-library/react'
import { uuid } from '@vulpo-dev/auth-sdk'

import { DefaultTranslation } from '../context/translation'
import { renderWithClient } from '../test-utils'
import Confirm from './confirm'

describe('passwordless', () => {
	it('can confirm passwordless', () => {
		let token = uuid()
		let id = uuid()
		let route = `/?id=${id}&token=${token}` 
		let client = renderWithClient(route, <Confirm />)

		let button = screen.queryByText(DefaultTranslation.signin.label)
		expect(button).toBeTruthy()
		fireEvent.click(button!)
		
		expect(client.confirmPasswordless).toBeCalledWith(id, token)
	})

	it('fails when id is empty', () => {
		let token = uuid()
		let id = ''
		let route = `/?id=${id}&token=${token}` 
		let client = renderWithClient(route, <Confirm />)

		let button = screen.queryByText(DefaultTranslation.signin.label)
		expect(button).toBeTruthy()
		fireEvent.click(button!)
		
		expect(client.confirmPasswordless).toBeCalledTimes(0)

		let error = screen.queryByText(DefaultTranslation.error.generic)
		expect(error).toBeTruthy()
	})

	it('fails when token is empty', () => {
		let token = ''
		let id = uuid()
		let route = `/?id=${id}&token=${token}` 
		let client = renderWithClient(route, <Confirm />)

		let button = screen.queryByText(DefaultTranslation.signin.label)
		expect(button).toBeTruthy()
		fireEvent.click(button!)
		
		expect(client.confirmPasswordless).toBeCalledTimes(0)

		let error = screen.queryByText(DefaultTranslation.error.generic)
		expect(error).toBeTruthy()
	})

	it('can handle invalid token', async () => {
		let token = uuid()
		let id = 'token-invalid'
		let route = `/?id=${id}&token=${token}` 
		renderWithClient(route, <Confirm />)

		let button = screen.queryByText(DefaultTranslation.signin.label)
		expect(button).toBeTruthy()
		fireEvent.click(button!)

		let error = await waitFor(
			() => screen.findByText(DefaultTranslation.error.generic)
		)
		expect(error).toBeTruthy()
	})

	it('can handle expired token', async () => {
		let token = uuid()
		let id = 'token-expire'
		let route = `/?id=${id}&token=${token}` 
		renderWithClient(route, <Confirm />)

		let button = screen.queryByText(DefaultTranslation.signin.label)
		expect(button).toBeTruthy()
		fireEvent.click(button!)

		let error = await waitFor(
			() => screen.findByText(DefaultTranslation.error.generic)
		)
		expect(error).toBeTruthy()
	})
})
