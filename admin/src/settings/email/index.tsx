import React from 'react'
import { FunctionComponent, FormEvent, ChangeEvent } from 'react'
import styled from 'styled-components'
import { Select, Option } from '@biotic-ui/select'
import { Button } from '@biotic-ui/button'
import { Header, Section } from 'settings/component/layout'
import { Input, Section as ISection, Label } from '@biotic-ui/input'

import {
	useEmailSettings,
	EmailProvider,
	DefaultEmailSettings,
	useSaveEmailSettings,
	useSetEmailSettings,
} from 'data/settings'
import { useProject } from 'data/project'

type Props = {
	project: string
}

let EmailSettings: FunctionComponent<Props> = () => {
	let [project] = useProject()
	let setForm = useSetEmailSettings(project.id)
	let [{ data, initialData }, setSettings] = useEmailSettings(project.id)
	let save = useSaveEmailSettings(project.id)

	function handleSubmit(e: FormEvent) {
		e.preventDefault()
		save.handler()
	}

	let isLoading = data === undefined

	return (
		<form onSubmit={handleSubmit}>
			<Section>
				<Header>
					<h2>Email</h2>
					
					<Button
						loading={save.loading}
						disabled={data === undefined}
					>
						Save
					</Button>
				</Header>

				<ISection>
					<Address>
						<Host>
							<Label>Host:</Label>
							<Input
								value={data?.host ?? ''}
								onChange={setForm}
								name='host'
								disabled={isLoading}
							/>
						</Host>

						<Port>
							<Label>Port:</Label>
							<Input
								value={data?.port ?? 465}
								onChange={setForm}
								name='port'
								disabled={isLoading}
							/>
						</Port>
					</Address>
				</ISection>
				<ISection>
					<Label>From Email:</Label>
					<Input
						type='email'
						value={data?.from_email ?? ''}
						onChange={setForm}
						name='from_email'
						disabled={isLoading}
					/>
				</ISection>
				<ISection>
					<Label>From Name:</Label>
					<Input
						value={data?.from_name ?? ''}
						onChange={setForm}
						name='from_name'
						disabled={isLoading}
					/>
				</ISection>
				<ISection>
					<Label>Username:</Label>
					<Input
						value={data?.username ?? ''}
						onChange={setForm}
						name='username'
						disabled={isLoading}
					/>
				</ISection>
				<ISection>
					<Label>Password:</Label>
					<Input
						value={data?.password ?? ''}
						onChange={setForm}
						name='password'
						disabled={isLoading}
					/>
				</ISection>
			</Section>
		</form>
	)
}

export default EmailSettings


let Address = styled.div`
	display: flex;
`

let Host = styled.div`
	flex-grow: 1;
	margin-right: var(--baseline-2);
`

let Port = styled.div`
	width: calc(var(--baseline) * 13);
`