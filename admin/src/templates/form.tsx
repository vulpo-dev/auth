import React from 'react'
import { FunctionComponent, ChangeEvent } from 'react'
import styled from 'styled-components'
import { TemplateType, useTemplate, useSaveTemplate } from 'data/template'
import { Button, LinkButton } from '@biotic-ui/button'
import { Section, Label, Input, Textarea } from '@biotic-ui/input'
import { QueryState } from '@biotic-ui/boson'

type TemplateFormProps = {
	project: string;
	template: TemplateType;
}

export let TemplateForm: FunctionComponent<TemplateFormProps> = ({
	project,
	template: type
}) => {
	let [{ state, data: template }, actions] = useTemplate(project, type)
	let onSubmit = useSaveTemplate(project, type)

	function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
		let { name, value } = e.target
		actions.set({ ...template!, [name]: value })
	}

	let isLoading = state === QueryState.Loading

	return (
		<FormWrapper>
			<form onSubmit={onSubmit}>
				<FormHeader>
					<LinkButton onClick={() => actions.reset()}>Reset</LinkButton>
					<Button disabled={onSubmit.loading}>Save</Button>
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
	width: 100%;
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