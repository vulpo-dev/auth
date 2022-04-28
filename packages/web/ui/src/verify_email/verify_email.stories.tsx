import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { ErrorCode } from '@riezler/auth-sdk'
import { VerifyEmail } from 'verify_email'

export default {
	title: 'Verify Email',
	component: VerifyEmail, 
} as Meta

export let Loading = () => {
	return (
		<div className="vulpo-auth vulpo-auth-container">
			<div className="vulpo-auth-box-shadow">
				<VerifyEmail
					loading={true}
					error={null}
				/>
			</div>
		</div>
	)
}

export let Verified = () => {
	return (
		<div className="vulpo-auth vulpo-auth-container">
			<div className="vulpo-auth-box-shadow">
				<VerifyEmail
					loading={false}
					error={null}
				/>
			</div>
		</div>
	)
}

export let Error = () => {
	return (
		<div className="vulpo-auth vulpo-auth-container">
			<div className="vulpo-auth-box-shadow">
				<VerifyEmail
					loading={false}
					error={ErrorCode.GenericError}
				/>
			</div>
		</div>
	)
}