import React from 'react'
import { useState, FunctionComponent, ChangeEvent } from 'react'
import styled from 'styled-components'
import { SidebarLayout, Aside, Main } from '@biotic-ui/layout'
import { Link, useLocation, useRouteMatch, Redirect } from 'react-router-dom'
import { useProject } from 'data/project'
import { TemplateType, isTemplate, useTemplate, useSaveTemplate } from 'data/template'
import { Button, LinkButton } from '@biotic-ui/button'

import { Section, Label, Input, Textarea } from '@biotic-ui/input'

let Templates = () => {
	let [open, setOpen] = useState(true)
	let match = useRouteMatch<{ project: string; template: string }>('/:project/templates/:template')
	let [project] = useProject()

	return (
		<Wrapper>
			<SidebarLayout>
				<Aside drawer='(max-width: 900px)' open={open} onClose={() => setOpen(false)}>
					<TemplateList />
				</Aside>
				<Main>
					{ (match && isTemplate(match.params.template)) &&
						<TemplateForm
							project={project.id}
							template={match.params.template}
						/>
					}

					{ (!match || !isTemplate(match.params.template)) &&
						<Redirect to={`/${project.id}/templates/${TemplateType.Passwordless}`} />
					}
				</Main>
			</SidebarLayout>
		</Wrapper>
	)
}

export default Templates

let Wrapper = styled.div`
	--drawer-background: var(--color-background);
	--aside-background: none;
	height: 100%;
`

let TemplateList = () => {
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


type TemplateFormProps = {
	project: string;
	template: TemplateType;
}

let TemplateForm: FunctionComponent<TemplateFormProps> = ({ project, template: type }) => {
	let [template, setTemplate, resetTemplate] = useTemplate(project, type)
	let onSubmit = useSaveTemplate(project, type)

	function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
		let t = template!
		let { name, value } = e.target
		setTemplate({ ...t, [name]: value })
	}

	let isLoading = template === undefined

	return (
		<FormWrapper>
			<form onSubmit={onSubmit.save}>
				<FormHeader>
					<LinkButton onClick={resetTemplate}>Reset</LinkButton>
					<Button>Save</Button>
				</FormHeader>
				<Section>
					<Label>From Name:</Label>
					<Input
						name='from_name'
						value={template?.from_name ?? ''}
						onChange={handleChange}
						disabled={isLoading}
					/>
				</Section>
				
				<Section>
					<Label>Subject:</Label>
					<Input
						name='subject'
						value={template?.subject ?? ''}
						onChange={handleChange}
						disabled={isLoading}
					/>
				</Section>
				
				<Section>
					<Label>Redirect To:</Label>
					<Input
						name='redirect_to'
						value={template?.redirect_to ?? ''}
						onChange={handleChange}
						disabled={isLoading}
					/>
				</Section>

				<Section>
					<Label>Body:</Label>
					<Textarea
						disabled={isLoading}
						name='body'
						value={template?.body ?? ''}
						minRows={12}
						maxHeight={575}
						onChange={handleChange}
					/>
				</Section>
			</form>
		</FormWrapper>
	)
}

let FormWrapper = styled.div`
	max-width: 800px;
	margin: 0 auto;
	padding-top: var(--baseline-3);
`

let FormHeader = styled.header`
	display: flex;
	justify-content: flex-end;
	margin-bottom: var(--baseline-3);

	button {
		margin-left: var(--baseline);
	}
`