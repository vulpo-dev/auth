import React, { Fragment } from 'react'
import { useEffect, Suspense, useState } from 'react'
import styled from 'styled-components'
import {
	useMatch,
	Routes,
	Route,
	NavLink,
	Navigate,
	useNavigate,
	useLocation,
} from 'react-router-dom'

import { useBosonValue, useSetBoson } from '@biotic-ui/boson'

import { Tabs, TabBar, Tab } from 'component/tabs'
import { useProjects, PartialProject, ProjectCtx } from 'data/project'
import { getLatesUrl } from 'data/admin'
import { AddButton, Button, CloseButton } from 'component/button'
import CreateProject from 'component/create_project'
import { Drawer } from '@biotic-ui/drawer'
import { Scrollbar } from '@biotic-ui/leptons'
import Tooltip from 'component/tooltip'

import Users from 'dashboard/component/users'
import SignInMethods from 'dashboard/component/sign_in_methods'
import Settings from 'dashboard/component/settings'
import Templates from 'dashboard/component/templates'
import CreateUser from 'user/create'

function Dashboard() {
	let navigate = useNavigate()
	let [{ data: projects }] = useProjects()
	let match = useMatch('/:project/*')
	let project = match?.params.project ?? ''

	let [create, setCreate] = useState(false)
	let hasProjects = projects?.length ?? 0

	useEffect(() => {

		if (project === 'create' || project !== '' || !projects) {
			return
		}

		if (hasProjects <= 1) {
			navigate(`/project/create`, { replace: true })
			return
		}

		let [{ id }] = projects
 		if (!project) {
			navigate(`/${id}`)
		}
	}, [hasProjects, project, projects])


	function handleProjectCreated(project: PartialProject) {
		setCreate(false)
		navigate(`/${project.id}`)
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
			
			{ (projects && project) &&
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
		<Suspense fallback={<p>...loading</p>}>
			<Dashboard />
		</Suspense>
	)
}

let Main = () => {
	let location = useLocation()
	let match = useMatch('/:project/*')
	let project = match?.params.project ?? ''
	let base = `/${project}`

	let setUrl = useSetBoson(getLatesUrl(project))
	useEffect(() => {
		setUrl(location.pathname)
	}, [location])


	let [userDrawer, setUserDrawer] = useState(false)

	return (
		<Wrapper>
			<Bar>				
				<Routes>
					<Route path={`${base}/users`} element={
						<Fragment>
							<h3>Users</h3>
							<Button onClick={() => setUserDrawer(true)}>Add User</Button>
							<Drawer open={userDrawer} left={false} maxWidth={600} onClose={() => setUserDrawer(false)} >
								<CreateUser onCreated={() => setUserDrawer(false)} />
							</Drawer>
						</Fragment>
					}></Route>
					<Route path={`${base}/methods`} element={<h3>Sign In Methods</h3>} />
					<Route path={`${base}/templates/*`} element={<h3>Templates</h3>} />
					<Route path={`${base}/settings`} element={<h3>Settings</h3>} />
				</Routes>
			</Bar>

			<Content>
				<Routes>
					<Route path={`${base}/users`} element={<Users project={project} />} />
					<Route path={`${base}/methods`} element={<SignInMethods project={project} />} />
					<Route path={`${base}/templates/*`} element={<Templates />} />
					<Route path={`${base}/settings`} element={<Settings />} />
					<Route path={base} element={<Navigate to={`${base}/users`} />} />
				</Routes>
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
	project: Omit<PartialProject, 'domain'>
}

let TabItem = ({ project }: TabItemProps) => {
	let location = useLocation()
	let url = useBosonValue(getLatesUrl(project.id))
	let active = location.pathname.startsWith(`/${project.id}`)

	return (
		<Tab $isActive={active} key={project.id} to={url}>
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
	z-index: 1;

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