import React from 'react'
import { FC } from 'react'
import styled from 'styled-components'
import { Plus, X } from 'phosphor-react'

export { Button } from '@biotic-ui/button'

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

export let AddButton: FC<{ onClick?: () => void; }> = (props) => {
	return (
		<IconButton {...props}>
			<Plus size={21} />
		</IconButton>
	)
}

export let CloseButton: FC<{ onClick?: () => void; }> = (props) => {
	return (
		<IconButton {...props}>
			<X size={24} />
		</IconButton>
	)
} 