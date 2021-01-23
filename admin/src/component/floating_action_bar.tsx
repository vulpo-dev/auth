import React from 'react'
import { FC, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useOnEscape } from '@biotic-ui/std'
import { X } from 'phosphor-react'

let StyledFloatingActionBar = styled(motion.div)`
	position: fixed;
	bottom: var(--baseline-2);
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
`

let ContentWrapper = styled.div<{ open: boolean }>`
	position: relative;
	background: #000;
	padding: var(--baseline-2) calc(var(--baseline) * 7);
	display: flex;
	grid-column-gap: var(--baseline-3);
	border-radius: var(--baseline-2);
	${p => p.open ? 'box-shadow: var(--shadow-5);' : '' }
`

type Props = {
	open?: boolean;
	onClose?: () => void;
}

export let FloatingActionBar: FC<Props> = ({
	children,
	onClose = () => {},
	open = false,
}) => {
	
	let variants = {
		hidden: {
			transform: 'translateY(100%)',
			opacity: 0,
		},
		visible: {
			transform: 'translateY(0%)',
			opacity: 1,
		}
	}

	useOnEscape(onClose)

	return (
		<StyledFloatingActionBar
			initial='hidden'
			animate={open ? 'visible' : 'hidden'}
			variants={variants}
		>
			<ContentWrapper open={open}>
				{ children }

				<CloseWrapper onClick={onClose}>
					<X size={24} />
				</CloseWrapper>
			</ContentWrapper>
		</StyledFloatingActionBar>
	)
}

export let ActionItem = styled.button`
	--size: calc(var(--baseline) * 6);
	min-width: var(--size);
	min-height: var(--size);
	padding: var(---baseline);
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	background: none;
	border: none;
	color: #fff;
	flex-direction: column;
`

export let ActionLabel = styled.label`
	width: 100%;
	text-align: center;
	display: block;
	margin-top: var(--baseline);
	margin-bottom: 0;
`

let CloseWrapper = styled.button`
	position: absolute;
	top: -8px;
	right: -8px;
	background: #fff;
	border: 1px solid #000;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	width: 24px;
	height: 24px;
	padding: 4px;
`