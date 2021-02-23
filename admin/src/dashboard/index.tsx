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
	useHistory,
	useLocation,
} from 'react-router-dom'

import { useBosonValue, useSetBoson } from '@biotic-ui/boson'

import { Tabs, TabBar, Tab } from 'component/tabs'
import { useProjects, PartialProject, ProjectCtx } from 'data/project'
import { getLatesUrl } from 'data/admin'
import { AddButton, CloseButton } from 'component/button'
import CreateProject from 'component/create_project'
import { Drawer } from '@biotic-ui/drawer'
import { Scrollbar } from '@biotic-ui/leptons'
import { Button } from '@biotic-ui/button'
import Tooltip from 'component/tooltip'

import Users from 'dashboard/component/users'
import SignInMethods from 'dashboard/component/sign_in_methods'
import Settings from 'dashboard/component/settings'
import Templates from 'dashboard/component/templates'

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

	let currentProject = !projects ? undefined : projects.find(p => {
		return p.id === project
	})

	return (
		<Tabs>
			<TabBar>
				<TabsWrapper>
					{ projects?.map(project => <TabItem key={project.id} project={project} />) }
				</TabsWrapper>
				<StyledAddButton onClick={() => setCreate(true)} />
			</TabBar>
			
			{ projects &&
				<ProjectCtx.Provider value={currentProject}>
					<Main />
				</ProjectCtx.Provider>
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
	let location = useLocation()
	let match = useRouteMatch<{ project: string }>('/:project')
	let project = match?.params?.project ?? ''
	let base = `/${project}`

	let setUrl = useSetBoson(getLatesUrl(project))
	useEffect(() => {
		setUrl(location.pathname)
	}, [location])

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
						<Templates />
					</Route>
					<Route path={`${base}/settings`}>
						<Settings project={project} />
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


type TabItemProps = {
	project: PartialProject
}

let TabItem = ({ project }: TabItemProps) => {
	let location = useLocation()
	let url = useBosonValue(getLatesUrl(project.id))
	let active = location.pathname.startsWith(`/${project.id}`)

	return (
		<Tab isActive={active} key={project.id} to={url}>
			<Tooltip content={project.name} delay={[1000, null]}>
				<span>{project.name}</span>
			</Tooltip>
		</Tab>
	)
}

let Wrapper = styled.main`
	display: inline-grid;
	grid-template-rows: var(--baseline-5) auto var(--baseline-5);
	height: calc(100vh - var(--baseline-4));
	color: #fff;

	--input-border: 1px solid #000;
	--input-color: #fff;
	--input-bg: #222043;
`

let Bar = styled.section`
	background: #222043;
	height: var(--baseline-5);
	width: 100%;
	box-shadow: var(--shadow-1);
	padding: 0 var(--baseline-2);
	display: flex;
	align-items: center;
	justify-content: space-between;

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
		text-decoration-thickness: 3px;
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
	overflow-y: auto;
	
	&::-webkit-scrollbar {
	  display: none;
	}

	-ms-overflow-style: none;  /* IE and Edge */
  	scrollbar-width: none;  /* Firefox */
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