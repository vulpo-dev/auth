import React from 'react'
import { FC, useMemo } from 'react'
import { createContext, useContext } from 'react'
import { Link } from 'react-router-dom'
import { ErrorCode } from '@riezler/auth-sdk'

type DisclaimerProps = { tos: string, privacy: string }
type ResetProps = { email: string | null }; 

type Translations = {
	signin: {
		title: string;
		label: string;
		info: string;
	};

	signup: {
		title: string;
		label: string;
		info: string;
	};

	email: {
		label: string;
	};

	password: {
		label: string;
		title: string;
		forgot: string;
	};

	reset_password: {
		title: string;
		info: string;
		button: string;
	};

	reset_check_mail: {
		title: string;
		description: FC<ResetProps>;
		info: string;
	};

	label: {
		email: string;
		password: string;
	};

	Disclaimer: FC<DisclaimerProps>;

	error: {
		password_min_length: string;
		password_max_length: string;
		invalid_email_password: string;
		generic: string;
		not_allowed: string;
		unavailable: string;
	};
}

export let DefaultTranslation = {
	signin: {
		title: 'Welcome Back.',
		label: 'Sign In',
		info: 'Already have an account?'
	},

	signup: {
		title: 'Create an account',
		label: 'Sign Up',
		info: `Don't have an account?`
	},

	email: {
		label: 'Authentication Link'
	},

	label: {
		email: 'Email',
		password: 'Password',
	},

	password: {
		label: 'Email and Password',
		title: 'Email and Password',
		forgot: 'Forgot Password?',
	},

	reset_check_mail: {
		title: 'Reset link sent',
		info: '(It might take a couple of minutes for the link to arrive)',
		description: ({ email }: ResetProps) => {

			if (email === null || email.trim() === '') {
				return <p>We have send you an authentication link to your inbox for you to reset your password.</p>
			}

			return <p>We have send you an authentication link to <strong>{email}</strong> for you to reset your password.</p>
		}
	},

	reset_password: {
		title: 'Reset Password',
		info: 'Enter your email address and we will send you a link to reset your password.',
		button: 'Send Reset Password Link',
	},

	Disclaimer: ({ tos, privacy }: DisclaimerProps) => {
		return (
			<small>
				By continuing you agree to our <Link to={tos}>Terms of Use</Link> and <Link to={privacy}>Privacy Policy</Link>.
			</small>
		)
	},

	error: {
		password_min_length: 'Your password should be at least 8 characters long',
		password_max_length: 'Your password cannot be longer than 64 characters',
		invalid_email_password: 'Invalid Email or Password',
		generic: 'Something went wrong',
		not_allowed: 'Not Allowed',
		unavailable: 'Authentication Service Unavailable',
	}
}

export let Translation = createContext(DefaultTranslation)

export function useTranslation(): Translations {
	return useContext(Translation)
}

export function useError(code: ErrorCode | null): string | null {
	let t = useTranslation()
	return useMemo(() => {
		if (code === null) {
			return null
		}

		switch(code) {
			case ErrorCode.PasswordMinLength:
				return t.error.password_min_length

			case ErrorCode.PasswordMaxLength:
				return t.error.password_max_length

			case ErrorCode.InvalidEmailPassword:
				return t.error.invalid_email_password

			case ErrorCode.NotAllowed:
				return t.error.not_allowed

			default:
				return t.error.generic
		}
	}, [code, t])
}