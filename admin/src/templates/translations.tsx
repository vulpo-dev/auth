import React, { ChangeEvent, useContext, useState } from 'react'
import styled from 'styled-components'
import { FormWrapper } from 'templates/layout'
import { Button, LinkButton } from '@biotic-ui/button'
import { Select, Option } from '@biotic-ui/select'
import { Section, Label, Textarea } from '@biotic-ui/input'
import { Languages } from 'data/languages'
import { useTranslations, useSetTranslation } from 'data/translations'
import { TemplateCtx } from 'templates/ctx'
import { GhostBar } from 'component/loading'
import { QueryState } from '@biotic-ui/boson'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryParams } from '@biotic-ui/std'
import { ErrorMessage } from '@biotic-ui/text'

let languages = Object.entries(Languages)

export let Translations = () => {
	let navigate = useNavigate()
	let location = useLocation()
	let params = useQueryParams(location.search)
	let currentLanguage = params.get('language') ?? 'en'

	function handleLanguage(e: ChangeEvent<HTMLSelectElement>) {

		params.set('language', e.target.value)

		navigate({
			...location,
			search: `?${params.toString()}`
		}, { replace: true })
	}

	let { project, template } = useContext(TemplateCtx)
	let [{ data, state }, action] = useTranslations(project, template)
	let update = useSetTranslation(project, template)
	let [error, setError] = useState<'json' | null>(null)

	async function handleUpdate() {
		if (!data || !data[currentLanguage]) {
			return
		}

		try {
			let content = JSON.parse(data[currentLanguage])
			await update(currentLanguage, content)
		} catch (err) {
			if(err instanceof SyntaxError) {
				setError('json')
			}
		}

	}

	function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
		if (error) {
			setError(null)
		}

		action.set(state => {
			return {
				...state,
				[currentLanguage]: e.target.value,
			}
		})
	}

	function toOption([code, lang]: [string, { name: string }]) {
		return <Option value={code} key={code}>{lang.name}</Option>
	}

	let hasTranslation = languages
		.filter(([code]) => data && data[code] !== undefined)
		.map(toOption)

	let addLanguage = languages
		.filter(([code]) => data && data[code] === undefined)
		.map(toOption)

	return (
		<FormWrapper>
			<FormHeader>
				<section>
					{ (state === 'loading' && data === undefined) &&
						<GhostBar height='32px' />
					}

					{ data !== undefined &&
						<Select disabled={update.loading} value={currentLanguage} onChange={handleLanguage}>
							{ hasTranslation }
							<optgroup label="Add Language">
								{ addLanguage }
							</optgroup>
						</Select>
					}
				</section>
				<section>
				</section>
				<section className="buttons">
					<LinkButton onClick={() => action.reset()}>Reset</LinkButton>
					<Button disabled={update.loading} onClick={() => handleUpdate()}>Save</Button>
				</section>
			</FormHeader>

			<Section>
				<Header>
					<Label htmlFor="content">Content</Label>
					{ error === 'json' &&
						<StyledError>Syntax Error</StyledError>
					}
				</Header>
				<StyledTextarea
					id="content"
					error={error === 'json'}
					value={(data && data[currentLanguage]) ?? ''}
					minRows={30}
					maxHeight={800}
					onChange={handleChange}
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

let Header = styled.div`
	display: flex;
	justify-content: space-between;
	margin-bottom: 1.25em;
`

let StyledTextarea = styled(Textarea)<{ error: boolean }>`
	border-color: ${p => p.error ? 'var(--red)' : ''};
`

let StyledError = styled(ErrorMessage)`
	text-align: right;
	margin-bottom: 0;
`