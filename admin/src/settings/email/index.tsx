import React from 'react'
import { FunctionComponent, FormEvent, ChangeEvent } from 'react'
import styled from 'styled-components'
import { Select, Option } from '@biotic-ui/select'
import { Button } from '@biotic-ui/button'
import { Header, Section } from 'settings/component/layout'

import {
	useEmailSettings,
	EmailProvider,
	DefaultMailGun,
	useSaveEmailSettings,
} from 'data/settings'

import MailGun from 'settings/email/mailgun'

type Props = {
	project: string
}

let EmailSettings: FunctionComponent<Props> = ({ project }) => {
	let [{ data, initialData }, setSettings] = useEmailSettings(project)
	let save = useSaveEmailSettings(project)

	function handleChange(e: ChangeEvent<HTMLSelectElement>) {
		let provider = (e.target.value as EmailProvider)
		
		if (initialData?.provider === provider) {
			setSettings(initialData)
			return
		}

		switch(provider) {
			case EmailProvider.MailGun:
				setSettings(DefaultMailGun)
			break

			case EmailProvider.None:
			default:
				setSettings({ provider: EmailProvider.None })
		}
	}	

	return (
		<Section>
			<Header>
				<h2>Email</h2>
				
				<div>
					<Select value={data?.provider} onChange={handleChange}>
						<Option value={EmailProvider.None}>-- select provider --</Option>
						<Option value={EmailProvider.MailGun}>Mailgun</Option>
					</Select>
				</div>
			</Header>

			<div>
				{ data?.provider === EmailProvider.MailGun &&
					<MailGun value={data.settings.mailgun} />
				}
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
