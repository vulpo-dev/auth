import React from 'react'
import styled from 'styled-components'
import { FormWrapper } from 'templates/layout'
import { Button, LinkButton } from '@biotic-ui/button'
import { Select, Option } from '@biotic-ui/select'
import { Section, Label, Textarea } from '@biotic-ui/input'

import { Languages } from 'data/languages'

export let Translations = () => {

	let options = Object.entries(Languages).map(([code, lang]) => {
		return {
			value: code,
			label: lang.name,
		}
	})

	return (
		<FormWrapper>
			<FormHeader>
				<section>
					<Select>
						<optgroup label="Add Language">
							{ options.map(o => <Option value={o.value}>{o.label}</Option>) }
						</optgroup>
					</Select>
				</section>
				<section>
				</section>
				<section className="buttons">
					<LinkButton>Reset</LinkButton>
					<Button>Save</Button>
				</section>
			</FormHeader>

			<Section>
				<Label>Content</Label>
				<Textarea
					minRows={30}
					maxHeight={800}
				/>
			</Section>
		</FormWrapper>
	)
}

let FormHeader = styled.header`
	display: grid;
	grid-template-columns: 33% 33% 33%;
	margin-bottom: var(--baseline-3);

	> section {
		display: flex;
		align-items: center;
	}

	.buttons {
		display: flex;
		justify-content: flex-end;
	}

	.default {
		display: inline-block;
		margin-right: var(--baseline);
	}

	button {
		margin-left: var(--baseline);
	}
`