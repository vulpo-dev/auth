import React from 'react'
import { useEffect } from 'react'
import styled from 'styled-components'
import {
	HashRouter,
	useRouteMatch,
	Switch,
	Route,
	NavLink,
	Redirect
} from 'react-router-dom'
import { Tabs, TabBar, Tab } from 'component/tabs';


function Dashboard() {
	return (
		<Tabs>
			<TabBar>
				<Tab to='/one'>
					<span>Project One</span>
				</Tab>
				<Tab to='/two'>
					<span>Project Two</span>
				</Tab>
				<Tab to='/three'>
					<span>Project Three</span>
				</Tab>
				<Tab to='/four'>
					<span>Project Four</span>
				</Tab>
			</TabBar>

			<Main />
		</Tabs>
	)
}

export default function DashboardContainer() {
	return (
		<HashRouter>
			<Dashboard />
		</HashRouter>
	)
}

let Main = () => {
	let match = useRouteMatch<{ project: string }>('/:project')
	let project = match?.params?.project ?? ''
	let base = `/${project}`

	return (
		<Wrapper>
			<div>
				<Bar>				
					<Switch>
						<Route path={`${base}/users`}>
							<h3>Users</h3>
						</Route>
						<Route path={`${base}/methods`}>
							<h3>Sign In Methods</h3>
						</Route>
						<Route path={`${base}/templates`}>
							<h3>Templates</h3>
						</Route>
						<Route path={`${base}/settings`}>
							<h3>Settings</h3>
						</Route>
						<Redirect from={base} to={`${base}/users`} />
					</Switch>
				</Bar>
			</div>
			<Nav>
				<BottomLink to={`${base}/users`}>Users</BottomLink>
				<BottomLink to={`${base}/methods`}>Sign In Methods</BottomLink>
				<BottomLink to={`${base}/templates`}>Templates</BottomLink>
				<BottomLink to={`${base}/settings`}>Settings</BottomLink>
			</Nav>
		</Wrapper>
	)
}

let Wrapper = styled.main`
	display: inline-grid;
	grid-template-rows: 1fr var(--baseline-5);
`

let Bar = styled.section`
	background: #222043;
	height: var(--baseline-5);
	width: 100%;
	box-shadow: var(--shadow-1);
	padding: 0 var(--baseline-2);
	display: flex;
	align-items: center;

	h3 {
		margin: 0;
		color: var(--color-copy);
	}
`

let Nav = styled.nav`
	display: flex;
	justify-content: center;
	align-items: center;
`

let BottomLink = styled(NavLink)`
	color: var(--color-copy);
	text-decoration: none;
	padding: 0 var(--baseline-2);
	font-size: 1.25em;

	&.active {
		text-decoration: underline;
		text-decoration-color: var(--pink);
	}
`