import { NavLink } from 'react-router-dom';

import styled from 'styled-components'

export let Tabs = styled.div`
	display: grid;
	grid-template-rows: var(--baseline-4) 1fr;
	height: 100%;
`

export let TabBar = styled.header`
	background: #fff;
	display: flex;
`

export let Tab = styled(NavLink)`
	height: 100%;
	display: inline-flex;
	align-items: center;
	padding: 0 var(--baseline-2);
	color: #000;
	text-decoration: none;
	font-size: 0.75em;

	&:hover {
		background: rgba(0,0,0, 0.1);
	}

	&.active {
		background: #000;
		color: #fff;
	}
`