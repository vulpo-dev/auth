import React from 'react'
import { FC, useState } from 'react'
import styled from 'styled-components'
import { Container } from 'component/layout'
import { useFlags, Flags, useToggleFlags, useUpdateFlags } from 'data/flags'
import { Button } from 'component/button'
import { useEmailSettings, hasEmailProvider } from 'data/settings'

type Props = {
	project: string;
}

let SignInMethods: FC<Props> = ({ project }) => {
	let flags = useFlags(project)
	let items = flags.items ?? []
	let toggleFlag = useToggleFlags(project)
	let [updateFlags, updating] = useUpdateFlags(project)
	let [{ data: email }] = useEmailSettings(project)
	let hasEmail = hasEmailProvider(email)

	return (
		<Container>
			<FlagList>
				<Flag>
					<FlagTitle htmlFor='signin'>Sign In</FlagTitle>
					<input
						id='signin'
						type='checkbox'
						checked={items.includes(Flags.SignIn)}
						onChange={toggleFlag(Flags.SignIn)}
					/>
				</Flag>
				<Flag>
					<FlagTitle htmlFor='signup'>Sign Up</FlagTitle>
					<input
						id='signup'
						type='checkbox'
						checked={items.includes(Flags.SignUp)}
						onChange={toggleFlag(Flags.SignUp)}
					/>
				</Flag>
				<Flag disabled={!hasEmail}>
					<FlagTitle htmlFor='auth_link'>Authentication Link</FlagTitle>
					<input
						id='auth_link'
						type='checkbox'
						disabled={!hasEmail}
						checked={items.includes(Flags.AuthenticationLink)}
						onChange={toggleFlag(Flags.AuthenticationLink)}
					/>
				</Flag>
				<Flag>
					<FlagTitle htmlFor='emai_password'>Email and Password</FlagTitle>
					<input
						id='emai_password'
						type='checkbox'
						checked={items.includes(Flags.EmailAndPassword)}
						onChange={toggleFlag(Flags.EmailAndPassword)}
					/>
					{	items.includes(Flags.EmailAndPassword) &&
						<FlagList>
							<Flag disabled={!hasEmail}>
								<FlagTitle htmlFor='reset_password'>Reset Password</FlagTitle>
								<input
									id='reset_password'
									type='checkbox'
									disabled={!hasEmail}
									checked={items.includes(Flags.PasswordReset)}
									onChange={toggleFlag(Flags.PasswordReset)}
								/>
							</Flag>
							<Flag disabled={!hasEmail}>
								<FlagTitle htmlFor='verify_email'>Verify Email</FlagTitle>
								<input
									id='verify_email'
									type='checkbox'
									disabled={!hasEmail}
									checked={items.includes(Flags.VerifyEmail)}
									onChange={toggleFlag(Flags.VerifyEmail)}
								/>
							</Flag>
						</FlagList>
					}
				</Flag>
			</FlagList>
			<ButtonWrapper>
				<Button
					onClick={() => updateFlags(flags.items ?? [])}
					disabled={flags.items === undefined}
					loading={updating.loading}
				>
					Save
				</Button>
			</ButtonWrapper>
		</Container>
	)
}

export default SignInMethods

let FlagList = styled.ul`
	padding: 0;
	list-style-type: none;
	flex-shrink: 0;
	width: 100%;
	margin-top: 0;
`

let Flag = styled.li<{ disabled?: boolean }>`
	widht: 100%;
	background: #222043;
	border: 2px solid #000;
	margin-bottom: var(--baseline);
	min-height: calc(var(--baseline) * 6);
	padding: var(--baseline) var(--baseline-2);
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	opacity: ${p => p.disabled ? '0.8' : '1'};
`

let FlagTitle = styled.label`
	margin: 0;
	flex-grow: 1;
	cursor: pointer;
	font-size: calc(var(--baseline) * 2.5);
`

let ButtonWrapper = styled.section`
	display: flex;
	justify-content: flex-end;
`