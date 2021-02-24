import { Link } from 'react-router-dom';

import styled from 'styled-components'

export let Tabs = styled.div`
	display: grid;
	grid-template-rows: var(--baseline-4) 1fr;
	height: 100%;
`

export let TabBar = styled.header`
	background: #fff;
	display: flex;
	width: 100vw;
`

export let Tab = styled(Link)<{ $isActive: boolean }>`
	height: 100%;
	display: flex;
	align-items: center;
	padding: 0 var(--baseline-2);
	color: #000;
	text-decoration: none;
	font-size: 0.75em;
	width: calc(var(--baseline) * 19);
	border-right: 1px solid #000;
	flex-shrink: 0;

	&:hover {
		background: rgba(0,0,0, 0.1);
	}

	${p => p.$isActive && `
		background: #000!important;
		color: #fff!important;
	`}

	> * {
		display: block;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		cursor: pointer;
	}
`