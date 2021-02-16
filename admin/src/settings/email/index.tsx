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
	let project = useProject()
	let setForm = useSetEmailSettings(project.id)
	let [{ data, initialData }, setSettings] = useEmailSettings(project.id)
	let save = useSaveEmailSettings(project.id)

	return (
		<Section>
			<Header>
				<h2>Email</h2>
			
			</Header>

			<div>
				<form>
					<ISection>
						<Label>Host:</Label>
						<Input
							value={data?.host}
							onChange={setForm}
							name='host'
						/>
					</ISection>
					<ISection>
						<Label>From Email:</Label>
						<Input
							value={data?.from_email}
							onChange={setForm}
							name='from_email'
						/>
					</ISection>
					<ISection>
						<Label>From Name:</Label>
						<Input
							value={data?.from_name}
							onChange={setForm}
							name='from_name'
						/>
					</ISection>
					<ISection>
						<Label>Username:</Label>
						<Input
							value={data?.username}
							onChange={setForm}
							name='username'
						/>
					</ISection>
					<ISection>
						<Label>Password:</Label>
						<Input
							value={data?.password}
							onChange={setForm}
							name='password'
						/>
					</ISection>
					<ISection>
						<Label>Port:</Label>
						<Input
							value={data?.port}
							onChange={setForm}
							name='port'
						/>
					</ISection>
				</form>
			</div>

			<div>
				<Button
					onClick={save.handler}
					loading={save.loading}
					disabled={data === undefined}
				>
					Save
				</Button>
			</div>

		</Section>
	)
}

export default EmailSettings
