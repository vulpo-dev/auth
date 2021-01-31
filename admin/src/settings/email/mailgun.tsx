import React from 'react'
import { FunctionComponent, useEffect, ChangeEvent } from 'react'
import { Input, Section, Label } from '@biotic-ui/input'
import { useForm } from '@biotic-ui/std'
import { MailGunSettings, DefaultMailGunSettings, useSetEmailSettings } from 'data/settings'
import { useProject } from 'data/project'

type Props = {
	value: MailGunSettings;
}

let MailGun: FunctionComponent<Props> = ({ value }) => {
	let project = useProject()
	let setForm = useSetEmailSettings(project)
	console.log({ value })
	return (
		<form>
			<Section>
				<Label>Domain:</Label>
				<Input
					value={value.domain}
					onChange={setForm}
					name='domain'
				/>
			</Section>
			<Section>
				<Label>From Email:</Label>
				<Input
					value={value.from_email}
					onChange={setForm}
					name='from_email'
				/>
			</Section>
			<Section>
				<Label>From Name:</Label>
				<Input
					value={value.from_name}
					onChange={setForm}
					name='from_name'
				/>
			</Section>
			<Section>
				<Label>Api Key:</Label>
				<Input
					value={value.api_key}
					onChange={setForm}
					name='api_key'
				/>
			</Section>
			<Section>
				<Label>Username:</Label>
				<Input
					value={value.username}
					onChange={setForm}
					name='username'
				/>
			</Section>
		</form>
	)
}

export default MailGun