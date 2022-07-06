import { Meta } from '@storybook/react/types-6-0'
import { ErrorCode } from '@vulpo-dev/auth-sdk'
import { VerifyEmail } from './index'

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
					verified={false}
					onVerify={() => {}}
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
					verified={false}
					onVerify={() => {}}
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
					verified={false}
					onVerify={() => {}}
				/>
			</div>
		</div>
	)
}