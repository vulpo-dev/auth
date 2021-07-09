import React, { ChangeEvent } from 'react'
import styled from 'styled-components'
import { useUser } from 'data/user'
import { useProject } from 'data/project'
import { Input, Label, Section, Textarea } from '@biotic-ui/input'
import ReactJson from 'react-json-view'
import { Button, LinkButton } from 'component/button'

type Props = {
	userId: string | null
}

export default function UserDetails({ userId }: Props) {
	let [project] = useProject()
	let [user, setUser] = useUser(userId, project.id)

	function onChange(event: ChangeEvent<HTMLInputElement>) {
		let { name, value } = event.target
		setUser({ [name]: value })
	}

	function onTraitsChange(event: ChangeEvent<HTMLTextAreaElement>) {
		let traits = event.target.value.split(',').map(trait => trait.trimStart())
		setUser({ traits })
	}


	if (user.value === null || userId === null) {
		return null
	}

	if (user.value === undefined) {
		return <p>...loading</p>
	}

	return (
		<Wrapper>
			<form>
				<Header>
					<LinkButton type='button'>Reset</LinkButton>
					<Button>Save</Button>
				</Header>
				<Section>
					<Title>User: { user.value.email }</Title>
				</Section>
				<Section>
					<Label>User Id</Label>
					<Input value={user.value.id} readOnly />
				</Section>
				<Section>	
					<Label htmlFor='email'>Email:</Label>	
					<Input
						id='email'
						type='email'
						name='email'
						onChange={onChange}
						value={user.value.email}
					/>
				</Section>
				<Section>	
					<Label htmlFor='display_name'>Display Name:</Label>	
					<Input
						name='display_name'
						onChange={onChange}
						value={user.value.display_name ?? ''}
					/>
				</Section>
				<Section>	
					<Label htmlFor='traits'>Traits:</Label>	
					<Textarea
						id='traits'
						value={user.value.traits.join(', ')}
						onChange={onTraitsChange}
						rows={5}
					/>
				</Section>
			</form>
			<Section>
				<Label>Updated At:</Label>
				<p>{user.value.updated_at}</p>
			</Section>
			<Section>
				<Label>Created At:</Label>
				<p>{user.value.created_at}</p>
			</Section>
		</Wrapper>
	)
}


let Wrapper = styled.div`
	padding: var(--baseline-3);

	--input-bg: rgba(0,0,0, 0.3);
`

let Header = styled.header`
	margin-bottom: var(--baseline-2);
	display: flex;
	justify-content: flex-end;
`

let Title = styled.h3`
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
`