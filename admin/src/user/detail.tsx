import React, { ChangeEvent, FormEvent, useState } from 'react'
import styled from 'styled-components'
import { useUser, useUpdateUser } from 'data/user'
import { useProject } from 'data/project'
import { Input, Label, Section, ChipsInput } from '@biotic-ui/input'
import { Button, LinkButton, IconButton } from 'component/button'
import { X } from 'phosphor-react'

type Props = {
	userId: string | null
}

export default function UserDetails({ userId }: Props) {
	let [project] = useProject()
	let updateUser = useUpdateUser(project.id)
	let [{ data: user, initialData }, { set: setUser, reset }] = useUser(userId, project.id)
	let [focus, setFocus] = useState<number | null>(null)

	console.log({ initialData })

	function onChange(event: ChangeEvent<HTMLInputElement>) {
		let { name, value } = event.target
		setUser(user => {
			if (!user) {
				return
			}

			return {
				...user,
				[name]: value
			}
		})
	}

	function setTraits(traits: Array<string>) {
		setUser(user => {
			if (!user) {
				return
			}

			return {
				...user,
				traits,
			}
		})
	}

	function onTraitsChange(newTraits: Array<string>) {
		let traits = [
			...user?.traits ?? [],
			...newTraits,
		]

		setTraits(traits)
	}

	function removeTrait(trait: string) {
		return function() {
			let currentTraits = user?.traits ?? []
			let traits = currentTraits.filter(t => t !== trait)
			setTraits(traits)
		}
	}

	function handleDelete() {
		let traits = user?.traits ?? [] 
		let lastIndex = traits.length - 1

		if (focus !== null) {
			setTraits(traits.slice(0, lastIndex))
			setFocus(null)
		} else {
			setFocus(lastIndex)
		}
	}

	function handleCancel() {
		setFocus(null)
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault()

		if (!user) {
			return
		}

		try {
			await updateUser(user)
		} catch(err) {
			console.log(err)
		}
	}


	if (user === null || userId === null) {
		return null
	}

	if (user === undefined) {
		return <p>...loading</p>
	}

	return (
		<Wrapper>
			<form onSubmit={handleSubmit}>
				<Header>
					<LinkButton
						onClick={() => reset()}
						disabled={updateUser.loading}
						type='button'
					>Reset</LinkButton>
					<Button loading={updateUser.loading}>Save</Button>
				</Header>
				<Section>
					<Title className="user-detail--title">User: { initialData?.email }</Title>
				</Section>
				<Section>
					<Label>User Id</Label>
					<Input value={user.id} readOnly />
				</Section>
				<Section>	
					<Label htmlFor='email'>Email:</Label>	
					<Input
						id='email'
						type='email'
						name='email'
						onChange={onChange}
						value={user.email}
					/>
				</Section>
				<Section>	
					<Label htmlFor='display_name'>Display Name:</Label>	
					<Input
						name='display_name'
						onChange={onChange}
						value={user.display_name ?? ''}
					/>
				</Section>
				<Section>	
					<Label htmlFor='traits'>Traits:</Label>	
					<StyledChipsInput
						onAdd={onTraitsChange}
						onDelete={handleDelete}
						onCancelDelete={handleCancel}
					>
						{ user.traits.map((trait, index) =>
							<Chip key={trait} $focus={index === focus}>
								{trait}
								<IconButton onClick={removeTrait(trait)}>
									<X size={20}/>
								</IconButton>
							</Chip>
						)}
					</StyledChipsInput>
				</Section>
			</form>
			<Section>
				<Label>Updated At:</Label>
				<p>{user.updated_at}</p>
			</Section>
			<Section>
				<Label>Created At:</Label>
				<p>{user.created_at}</p>
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

let StyledChipsInput = styled(ChipsInput)`
	background: var(--input-bg);

	input {
		color: var(--color-copy);
	}
`

let Chip = styled.span<{ $focus: boolean }>`
	padding: calc(var(--baseline) / 2) var(--baseline-2);
	padding-right: calc(var(--baseline) / 2);
	border: 1px solid;
	color: var(--color-copy);
	border-radius: var(--baseline-2);
	border-color: var(${p => p.$focus ? '--red' : '--color-copy'});
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;

	display: flex;
	column-gap: calc(var(--baseline) / 2);
`