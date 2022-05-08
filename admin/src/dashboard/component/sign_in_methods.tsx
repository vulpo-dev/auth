import React from 'react'
import { FunctionComponent } from 'react'
import styled from 'styled-components'
import { Container } from 'component/layout'
import { useFlags, Flags, useToggleFlags, useUpdateFlags } from 'data/flags'
import { Button } from 'component/button'
import { useEmailSettings, hasEmailProvider, useGoogleSettings, useSetGoogleSettings } from 'data/settings'
import Tooltip from 'component/tooltip'
import { Input, Label, Section } from '@biotic-ui/input'

type Props = {
	project: string;
}

let SignInMethods: FunctionComponent<Props> = ({ project }): JSX.Element => {
	let [{ data, state }] = useFlags(project)
	let items = data ?? []
	let toggleFlag = useToggleFlags(project)
	let updateFlags = useUpdateFlags(project)
	let [{ data: emailSettings }] = useEmailSettings(project)
	let hasEmail = hasEmailProvider(emailSettings)
	let [[googleConfig], setGoogleConfig] = useGoogleSettings()
	let saveGoogleConfig = useSetGoogleSettings()

	return (
		<Container>
			<FlagList>
				<Flag>
					<FlagHeader>
						<FlagTitle htmlFor='signin'>Sign In</FlagTitle>
						<input
							id='signin'
							type='checkbox'
							checked={items.includes(Flags.SignIn)}
							onChange={toggleFlag(Flags.SignIn)}
						/>
					</FlagHeader>
				</Flag>
				
				<Flag>
					<FlagHeader>
						<FlagTitle htmlFor='signup'>Sign Up</FlagTitle>
						<input
							id='signup'
							type='checkbox'
							checked={items.includes(Flags.SignUp)}
							onChange={toggleFlag(Flags.SignUp)}
						/>
					</FlagHeader>
				</Flag>
				
				<Flag disabled={!hasEmail}>
					<FlagHeader>
						<Tooltip disabled={hasEmail} content="Disabled: Add email settings">
							<FlagTitle htmlFor='auth_link'>Authentication Link</FlagTitle>
						</Tooltip>
						<input
							id='auth_link'
							type='checkbox'
							disabled={!hasEmail}
							checked={items.includes(Flags.AuthenticationLink)}
							onChange={toggleFlag(Flags.AuthenticationLink)}
						/>
					</FlagHeader>
				</Flag>

				<Flag>
					<FlagHeader>
						<FlagTitle htmlFor='email_password'>Email and Password</FlagTitle>
						<input
							id='email_password'
							type='checkbox'
							checked={items.includes(Flags.EmailAndPassword)}
							onChange={toggleFlag(Flags.EmailAndPassword)}
						/>
					</FlagHeader>
					{	items.includes(Flags.EmailAndPassword) &&
						<FlagList>
								
							<Flag disabled={!hasEmail}>
								<FlagHeader>
									<Tooltip disabled={hasEmail} content="Disabled: Add email settings">
										<FlagTitle htmlFor='reset_password'>Reset Password</FlagTitle>
									</Tooltip>
									<input
										id='reset_password'
										type='checkbox'
										disabled={!hasEmail}
										checked={items.includes(Flags.PasswordReset)}
										onChange={toggleFlag(Flags.PasswordReset)}
									/>
								</FlagHeader>
							</Flag>

							<Flag disabled={!hasEmail}>
								<FlagHeader>
									<Tooltip disabled={hasEmail} content="Disabled: Add email settings">
										<FlagTitle htmlFor='verify_email'>Verify Email</FlagTitle>
									</Tooltip>
									<input
										id='verify_email'
										type='checkbox'
										disabled={!hasEmail}
										checked={items.includes(Flags.VerifyEmail)}
										onChange={toggleFlag(Flags.VerifyEmail)}
									/>
								</FlagHeader>
							</Flag>
						</FlagList>
					}
				</Flag>

				<Flag>
					<FlagHeader>
						<FlagTitle>Google</FlagTitle>
						<input
							id='oauth_google'
							type='checkbox'
							checked={items.includes(Flags.OAuthGoogle)}
							onChange={toggleFlag(Flags.OAuthGoogle)}
						/>
					</FlagHeader>
					{	items.includes(Flags.OAuthGoogle) &&
						<Form onSubmit={(e) => {
							e.preventDefault()
							saveGoogleConfig(googleConfig?.data)
						}}>
							<Header>
								<Button
									loading={saveGoogleConfig.loading}
									disabled={data === undefined}
								>
									Save Config
								</Button>
							</Header>
							<Section>
								<Label>Client ID</Label>
								<Input
									type="text"
									name="client_id"
									onChange={setGoogleConfig}
									value={googleConfig?.data?.client_id ?? ''}
									required
								/>
							</Section>
							<Section>
								<Label>Client Secret</Label>
								<Input
									type="text"
									name="client_secret"
									onChange={setGoogleConfig}
									value={googleConfig?.data?.client_secret ?? ''}
									required
								/>
							</Section>
							<Section>
								<Label>Redirect URI</Label>
								<Input
									type="url"
									name="redirect_uri"
									onChange={setGoogleConfig}
									value={googleConfig?.data?.redirect_uri ?? ''}
									required
								/>
							</Section>
						</Form>
					}
				</Flag>
			</FlagList>
			<ButtonWrapper>
				<Button
					onClick={() => updateFlags(data ?? [])}
					disabled={state !== 'loaded'}
					loading={updateFlags.loading}
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

	& {
		margin-top: var(--baseline); 
	}
`

let Flag = styled.li<{ disabled?: boolean }>`
	widht: 100%;
	background: #222043;
	border: 2px solid #000;
	margin-bottom: var(--baseline);
	min-height: calc(var(--baseline) * 6);
	padding: var(--baseline) var(--baseline-2);
	display: flex;
	flex-direction: column;
	flex-wrap: wrap;
	opacity: ${p => p.disabled ? '0.8' : '1'};
`

let FlagHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
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

let Form = styled.form`
	margin-top: 1rem;
`

let Header = styled.div`
	display: flex;
	justify-content: flex-end;
`