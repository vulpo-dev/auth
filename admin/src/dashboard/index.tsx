import React from 'react'
import { useEffect, Suspense, useState } from 'react'
import styled from 'styled-components'
import {
	HashRouter,
	useRouteMatch,
	Switch,
	Route,
	NavLink,
	Redirect,
	useHistory
} from 'react-router-dom'
import { Tabs, TabBar, Tab } from 'component/tabs'
import { useProjects, PartialProject } from 'data/project'
import { AddButton, CloseButton } from 'component/button'
import CreateProject from 'component/create_project'
import { Drawer } from '@biotic-ui/drawer'
import { Scrollbar } from '@biotic-ui/leptons'
import Tooltip from 'component/tooltip'

import Users from 'dashboard/component/users'
import SignInMethods from 'dashboard/component/sign_in_methods'

function Dashboard() {
	let history = useHistory()
	let [projects] = useProjects()
	let match = useRouteMatch<{ project: string }>('/:project')
	let project = match?.params?.project ?? ''

	let [create, setCreate] = useState(false)

	useEffect(() => {
		if (project !== '' || !projects) {
			return
		}

		if (projects.length === 0) {
			return
		}

		let [{ id }] = projects
		history.replace(`/${id}`)
	}, [project, projects])


	function handleProjectCreated(project: PartialProject) {
		setCreate(false)
		history.push(`/${project.id}`)
	}

	return (
		<Tabs>
			<TabBar>
				<TabsWrapper>
					{ projects && projects.map(project => 
						<Tab key={project.id} to={`/${project.id}`}>
							<Tooltip content={project.name} delay={[1000, null]}>
								<span>{project.name}</span>
							</Tooltip>
						</Tab>
					) }
				</TabsWrapper>
				<StyledAddButton onClick={() => setCreate(true)} />
			</TabBar>
			
			{ projects &&
				<Main />
			}

			<Drawer open={create} left={false} maxWidth={600} onClose={() => setCreate(false)}>
				<StyledCloseButton onClick={() => setCreate(false) } />
				<CreateProject onSuccess={handleProjectCreated} />
			</Drawer>
		</Tabs>
	)
}

export default function DashboardContainer() {
	return (
		<HashRouter>
			<Suspense fallback={<p>...loading</p>}>
				<Dashboard />
			</Suspense>
		</HashRouter>
	)
}

let Main = () => {
	let match = useRouteMatch<{ project: string }>('/:project')
	let project = match?.params?.project ?? ''
	let base = `/${project}`

	return (
		<Wrapper>
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

			<Content>
				<Switch>
					<Route path={`${base}/users`}>
						<Users project={project} />
					</Route>
					<Route path={`${base}/methods`}>
						<SignInMethods project={project} />
					</Route>
					<Route path={`${base}/templates`}>
						<h3>Templates</h3>
					</Route>
					<Route path={`${base}/settings`}>
						<h3>Settings</h3>
					</Route>
					<Redirect from={base} to={`${base}/users`} />
				</Switch>
			</Content>

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
	grid-template-rows: var(--baseline-5) auto var(--baseline-5);
	height: calc(100vh - var(--baseline-4));
	color: #fff;
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

let Content = styled.section`
	height: 100%;
	overflow: auto;
	${Scrollbar}
`

let TabsWrapper = styled.div`
	flex-grow: 1;
	display: flex;
`

let StyledAddButton = styled(AddButton)`
	width: var(--baseline-4);
	justify-content: center;
`

let StyledCloseButton = styled(CloseButton)`
	position: absolute;
	top: var(--baseline);
	right: var(--baseline);
`