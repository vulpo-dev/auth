import React from 'react'
import { FunctionComponent } from 'react'
import styled from 'styled-components'
import { Link, useLocation } from 'react-router-dom'
import { useProject } from 'data/project'
import { TemplateType } from 'data/template'

export let TemplateList = () => {
	return (
		<List>
			<ListItem type={TemplateType.Passwordless}>
				Passwordless
			</ListItem>
			<ListItem type={TemplateType.PasswordReset}>
				Reset Password
			</ListItem>
			<ListItem type={TemplateType.ChangeEmail}>
				Change Email
			</ListItem>
			<ListItem  type={TemplateType.VerifyEmail}>
				Verify Email
			</ListItem>
		</List>
	)
}

let List = styled.ul`
	list-style-type: none;
	margin: 0;
	padding: var(--baseline-3) var(--baseline-2);
`

let StyledListItem = styled.li<{ $isActive: boolean }>`
	font-size: calc(var(--baseline) * 2.5);
	line-height: 1;
	margin-bottom: calc(var(--baseline) * 2.5);

	a {
		color: inherit;
		text-decoration: none;

		${p => p.$isActive && `
			text-decoration: underline;
			text-decoration-color: var(--pink);
			text-decoration-thickness: 3px;
		`}
	}
`

type ListItemProps = {
	type: TemplateType;
}

let ListItem: FunctionComponent<ListItemProps> = ({ children, type }) => {
	let location = useLocation()
	let [project] = useProject()
	let url = `/${project.id}/templates/${type}`

	let active = location.pathname === url

	return (
		<StyledListItem $isActive={active}>
			<Link to={url}>
				{children}
			</Link>
		</StyledListItem>
	)
}
