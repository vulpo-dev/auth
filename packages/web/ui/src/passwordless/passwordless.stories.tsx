import { Story, Meta } from '@storybook/react/types-6-0'
import { action } from '@storybook/addon-actions'
import { HashRouter } from 'react-router-dom'

import { EnterEmail } from './enter_email'
import { CheckEmail } from './check'
import { Confirm } from './confirm'
import { ErrorCode } from '@vulpo-dev/auth-sdk'

export default {
	title: 'Passwordless',
} as Meta

export let Enter: Story = () => {
	return (
		<HashRouter>
			<div className="vulpo-auth vulpo-auth-container">
				<div className="vulpo-auth-box-shadow">
					<EnterEmail
						loading={false}
						error={null}
						onBack={action('onBack')}
						onSignIn={action('onSignIn')}
						ctx='signin'
					/>
				</div>
			</div>
		</HashRouter>
	)
}

Enter.storyName = 'Enter Email'

export let Check: Story = () => {
	return (	
		<div className="vulpo-auth vulpo-auth-container">
			<div className="vulpo-auth-box-shadow">
				<CheckEmail
					email='michael@riezler.co'
					type='signin'
				/>
			</div>
		</div>
	)
}

Check.storyName = 'Check Email'

export let ConfirmAuth: Story = () => {
	return (
		<HashRouter>		
			<div className="vulpo-auth vulpo-auth-container">
				<div className="vulpo-auth-box-shadow">
					<Confirm
						loading
						error={null}
						authenticated={false}
						onSignIn={() => {}}
					/>
				</div>
			</div>
		</HashRouter>
	)
}

export let ConfirmError: Story = () => {
	return (
		<HashRouter>
			<div className="vulpo-auth vulpo-auth-container">
				<div className="vulpo-auth-box-shadow">
					<Confirm
						loading={false}
						error={ErrorCode.GenericError}
						authenticated={false}
						onSignIn={() => {}}
					/>
				</div>
			</div>
		</HashRouter>
	)
}


export let ConfirmSuccess: Story = () => {
	return (
		<HashRouter>
			<div className="vulpo-auth vulpo-auth-container">
				<div className="vulpo-auth-box-shadow">
					<Confirm
						loading={false}
						error={null}
						authenticated={false}
						onSignIn={() => {}}
					/>
				</div>
			</div>
		</HashRouter>
	)
}

