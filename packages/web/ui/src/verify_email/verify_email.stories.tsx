import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { ErrorCode } from '@riezler/auth-sdk'
import { Container } from 'component/layout'
import { VerifyEmail } from 'verify_email'
import { BoxShadow } from 'component/card'

export default {
	title: 'Verify Email',
	component: VerifyEmail, 
} as Meta

export let Loading = () => {
	return (
		<Container>
			<BoxShadow>
				<VerifyEmail
					loading={true}
					error={null}
				/>
			</BoxShadow>
		</Container>
	)
}

export let Verified = () => {
	return (
		<Container>
			<BoxShadow>
				<VerifyEmail
					loading={false}
					error={null}
				/>
			</BoxShadow>
		</Container>
	)
}

export let Error = () => {
	return (
		<Container>
			<BoxShadow>
				<VerifyEmail
					loading={false}
					error={ErrorCode.GenericError}
				/>
			</BoxShadow>
		</Container>
	)
}