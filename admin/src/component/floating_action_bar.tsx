import { FC, ReactNode } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useOnEscape } from '@biotic-ui/std'
import { X } from 'phosphor-react'

export let StyledFloatingActionBar = styled(motion.div)`
	position: fixed;
	bottom: var(--baseline-2);
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
`

export let ContentWrapper = styled.div<{ open: boolean }>`
	position: relative;
	background: #000;
	padding: 0 calc(var(--baseline) * 3);
	display: flex;
	grid-column-gap: var(--baseline-3);
	border-radius: var(--baseline-2);
	${p => p.open ? 'box-shadow: var(--shadow-5);' : '' }
`

type Props = {
	open?: boolean;
	onClose?: () => void;
	children: ReactNode;
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

export let ActionItem = styled.button<{ disabled?: boolean }>`
	--size: calc(var(--baseline) * 6);
	min-width: var(--size);
	min-height: var(--size);
	padding: var(--baseline-2);
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	background: none;
	border: none;
	color: #fff;
	flex-direction: column;
	opacity: ${p => p.disabled ? 0.3 : 1};
	cursor: ${p => p.disabled ? 'default' : 'pointer'};

	&:hover {
		background: ${p => p.disabled ? '#000' : '#151515'};
	}
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