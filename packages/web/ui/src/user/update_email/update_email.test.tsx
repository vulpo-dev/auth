import { fireEvent, screen, waitFor } from '@testing-library/react'
import { uuid } from '@vulpo-dev/auth-sdk'
import { DefaultTranslation } from '../../context/translation'
import { renderWithClient } from '../../test-utils'
import Reject from './reject'
import Confirm from './confirm'

describe('update email: reject', () => {
	it('can reject', async () => {
		let token = uuid()
		let id = uuid()
		let route = `/?id=${id}&token=${token}` 
		let client = renderWithClient(route, <Reject />)

		let button = screen.getByText(DefaultTranslation.update_email_reject.label)
		fireEvent.click(button)

		expect(client.rejectUpdateEmail).toBeCalledWith(id, token)

		let msg = await waitFor(
			() => screen.findByText(DefaultTranslation.update_email_reject.submitted)
		)
		expect(msg).toBeInTheDocument()
	})

	it('fails when id is missing', () => {
		let token = uuid()
		let id = ''
		let route = `/?id=${id}&token=${token}` 
		let client = renderWithClient(route, <Reject />)

		let button = screen.getByText(DefaultTranslation.update_email_reject.label)
		fireEvent.click(button)

		expect(client.rejectUpdateEmail).toHaveBeenCalledTimes(0)

		let error = screen.getByText(DefaultTranslation.error.generic)
		expect(error).toBeInTheDocument()
	})

	it('fails when token is missing', () => {
		let token = ''
		let id = uuid()
		let route = `/?id=${id}&token=${token}` 
		let client = renderWithClient(route, <Reject />)

		let button = screen.getByText(DefaultTranslation.update_email_reject.label)
		fireEvent.click(button)

		expect(client.rejectUpdateEmail).toHaveBeenCalledTimes(0)

		let error = screen.getByText(DefaultTranslation.error.generic)
		expect(error).toBeInTheDocument()
	})

	it('not allowed', async () => {
		let token = uuid()
		let id = 'not_allowed'
		let route = `/?id=${id}&token=${token}` 
		renderWithClient(route, <Reject />)

		let button = screen.getByText(DefaultTranslation.update_email_reject.label)
		fireEvent.click(button)

		let error = await waitFor(
			() => screen.findByText(DefaultTranslation.error.not_allowed),
			{ timeout: 2000 }
		)
		expect(error).toBeInTheDocument()
	})
})

describe('update email: confirm', () => {
	it('can confirm', async () => {
		let token = uuid()
		let id = uuid()
		let route = `/?id=${id}&token=${token}` 
		let client = renderWithClient(route, <Confirm />)

		let button = screen.getByText(DefaultTranslation.update_email_confirm.label)
		fireEvent.click(button)

		expect(client.confirmUpdateEmail).toBeCalledWith(id, token)

		let msg = await waitFor(
			() => screen.findByText(DefaultTranslation.update_email_confirm.submitted)
		)
		expect(msg).toBeInTheDocument()
	})

	it('fails when id is missing', () => {
		let token = uuid()
		let id = ''
		let route = `/?id=${id}&token=${token}` 
		let client = renderWithClient(route, <Confirm />)

		let button = screen.getByText(DefaultTranslation.update_email_confirm.label)
		fireEvent.click(button)

		expect(client.confirmUpdateEmail).toHaveBeenCalledTimes(0)

		let error = screen.getByText(DefaultTranslation.error.generic)
		expect(error).toBeInTheDocument()
	})

	it('fails when token is missing', () => {
		let token = ''
		let id = uuid()
		let route = `/?id=${id}&token=${token}` 
		let client = renderWithClient(route, <Confirm />)

		let button = screen.getByText(DefaultTranslation.update_email_confirm.label)
		fireEvent.click(button)

		expect(client.confirmUpdateEmail).toHaveBeenCalledTimes(0)

		let error = screen.getByText(DefaultTranslation.error.generic)
		expect(error).toBeInTheDocument()
	})

	it('not allowed', async () => {
		let token = uuid()
		let id = 'not_allowed'
		let route = `/?id=${id}&token=${token}` 
		renderWithClient(route, <Confirm />)

		let button = screen.getByText(DefaultTranslation.update_email_confirm.label)
		fireEvent.click(button)

		let error = await waitFor(
			() => screen.findByText(DefaultTranslation.error.not_allowed),
			{ timeout: 2000 }
		)
		expect(error).toBeInTheDocument()
	})
})
