import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { ErrorCode } from '@riezler/auth-sdk'
import { Container } from 'component/layout'
import { VerifyEmail } from 'verify_email'

export default {
	title: 'Verify Email',
	component: VerifyEmail, 
} as Meta

export let Loading = () => {
	return (
		<Container>
			<VerifyEmail
				loading={true}
				error={null}
			/>
		</Container>
	)
}

export let Verified = () => {
	return (
		<Container>
			<VerifyEmail
				loading={false}
				error={null}
			/>
		</Container>
	)
}

export let Error = () => {
	return (
		<Container>
			<VerifyEmail
				loading={false}
				error={ErrorCode.GenericError}
			/>
		</Container>
	)
}