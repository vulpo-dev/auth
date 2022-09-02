import { Story, Meta } from '@storybook/react/types-6-0'
import { action } from '@storybook/addon-actions'

import { Reject, RejectProps } from './reject'
import { ErrorCode } from '@vulpo-dev/auth-sdk'

export default {
	title: 'User/Update Email',
} as Meta

export let ResetUpdateEmail: Story<RejectProps> = (props) => {
	return (
		<div className="vulpo-auth vulpo-auth-container">
			<div className="vulpo-auth-box-shadow">
				<Reject
					loading={props.loading}
					error={props.error}
					submitted={props.submitted}
					onSubmit={action('submit')}
				/>
			</div>
		</div>
	)
}

ResetUpdateEmail.storyName = 'Reset'
ResetUpdateEmail.argTypes = {
	loading: {
		defaultValue: false,
		control: {
			type: 'boolean',
		},

	},
	submitted: {
		defaultValue: false,
		control: {
			type: 'boolean',
		},

	},
	error: {
		defaultValue: null,
		control: {
			type: 'select',
			options: [
				null,
				ErrorCode.InternalServerError,
				ErrorCode.NotAllowed,
				ErrorCode.Unavailable,
				ErrorCode.TokenInvalid,
				ErrorCode.TokenExpired,
			]
		}
	},
}