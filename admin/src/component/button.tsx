import React from 'react'
import { FunctionComponent, ButtonHTMLAttributes } from 'react'
import styled from 'styled-components'
import { Plus, X } from 'phosphor-react'
import { Button } from '@biotic-ui/button'

export { Button, LinkButton } from '@biotic-ui/button'

export let WarnButton = styled(Button)`
	--button-bg: var(--red);
	font-weight: bold;
`

export let IconButton = styled.button<{ disabled?: boolean }>`
	background: none;
	border: none;
	display: flex;
	align-items: center;
	text-decoration: none;
	color: inherit;
	cursor: ${p => p.disabled ? 'default' : 'pointer'};
	opacity: ${p => p.disabled ? '0.5' : '1'};
	padding: 0;
`

type Props = ButtonHTMLAttributes<HTMLButtonElement>

export let AddButton: FunctionComponent<Props> = (props) => {
	return (
		<IconButton {...props}>
			<Plus size={21} />
		</IconButton>
	)
}

export let CloseButton: FunctionComponent<Props> = (props) => {
	return (
		<IconButton {...props}>
			<X size={24} />
		</IconButton>
	)
} 