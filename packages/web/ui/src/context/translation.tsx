import React from 'react'
import { useMemo } from 'react'
import { createContext, useContext } from 'react'
import { Link } from 'react-router-dom'
import { ErrorCode } from '@vulpo-dev/auth-sdk'

type DisclaimerProps = { tos: string, privacy: string }
type ResetProps = { email: string | null };
type PasswordlessProps = { email: string | null; type: string };

export type ErrorMessage = {
	/* Sign Up */
	password_min_length: string;
	password_max_length: string;
	
	/* Password Reset */
	password_mismatch: string;
	reset_token_expire: string;
	reset_token_invalid: string;
	reset_token_not_found: string;

	/* Sign In */
	invalid_email_password: string;
	
	/* General */
	generic: string;
	not_allowed: string;
	unavailable: string;
}

export let DefaultTranslation = {
	signin: {
		title: 'Welcome Back.',
		label: 'Sign In',
		info: 'Already have an account?',
		nav: 'Sign In',
	},

	signup: {
		title: 'Create an account.',
		label: 'Sign Up',
		info: `Don't have an account?`,
		nav: 'Create Account',
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

	google: {
		label: 'Sign in with Google',
	},

	reset_check_mail: {
		title: 'Reset link sent',
		info: '(It might take a couple of minutes for the link to arrive)',
		description: ({ email }: ResetProps) => {

			if (!email|| email.trim() === '') {
				return (
					<p className="vulpo-auth-text">
						We have send an authentication link to your inbox for you to reset your password.
					</p>
				)
			}

			return (
				<p className="vulpo-auth-text">
					We have send an authentication link to <strong id="email">{email}</strong> for you to reset your password.
				</p>
			)
		}
	},

	reset_password: {
		title: 'Reset Password',
		info: 'Enter your email address and we will send you a link to reset your password.',
		button: 'Send Reset Password Link',
	},

	passwordless: {
		title: 'Authentication Link',
		info: ({ label }: { label: string }) => {
			return <span className="vulpo-auth-text">Enter your email address and we will send you a link to {label}</span>
		},
		button: 'Send Authentication Link',
	},

	passwordless_check: {
		title: 'Check your Email',
		info: '(It might take a couple of minutes for the link to arrive)',
		warning: 'Do not close this window until opening the email link.',
		description: ({ email, type }: PasswordlessProps) => {
			
			if (!email || email.trim() === '') {
				return <p className="vulpo-auth-text">We have send an authentication link to <strong>your inbox</strong> for you to {type}.</p>
			}

			return <p className="vulpo-auth-text">We have send an authentication link to <strong>{email}</strong> for you to {type}.</p>
		}
	},

	passwordless_confirm: {
		title: "Confirm Sign In",
		success: "Your sign in has been confirmed.",
		info: "You can now close this window.",
	},

	set_password: {
		title: 'Set New Password',
		new_password: 'New Password',
		repeat_password: 'Repeat Password',
		button_label: 'Set Password',
	},

	Disclaimer: ({ tos, privacy }: DisclaimerProps) => {
		return (
			<small className="vulpo-auth-text-small">
				By continuing you agree to our <Link to={tos}>Terms of Use</Link> and <Link to={privacy}>Privacy Policy</Link>.
			</small>
		)
	},

	error: {
		password_min_length: 'Your password should be at least 8 characters long',
		password_max_length: 'Your password cannot be longer than 64 characters',
		
		password_mismatch: 'Repeated password does not match the entered password',
		reset_token_expire: 'Reset Token is expired',
		reset_token_invalid: 'Reset Token is invalid',
		reset_token_not_found: 'Reset Token not found',

		invalid_email_password: 'Invalid Email or Password',
		
		generic: 'Something went wrong',
		not_allowed: 'Not Allowed',
		unavailable: 'Authentication Service is Unavailable',
	},

	verify_email: {
		title: 'Verifying Email',
		success: 'Your email has been verified',
	},
}

export type Translations = typeof DefaultTranslation

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

			case ErrorCode.ResetPasswordMismatch:
				return t.error.password_mismatch

			case ErrorCode.ResetInvalidToken:
				return t.error.reset_token_invalid

			case ErrorCode.ResetTokenNotFound:
				return t.error.reset_token_not_found

			case ErrorCode.ResetExpired:
				return t.error.reset_token_expire

			default:
				return t.error.generic
		}
	}, [code, t])
}