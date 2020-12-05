import { Switch, Route, Redirect } from 'react-router-dom'
import styled from 'styled-components'
import { Main, Header as HeaderWrapper } from 'component/layout'

import Project from 'setup/project'
import User from 'setup/user'

export default function Setup() {
	return (
		<Main>
			<Header />
			<Wrapper>
				<Content>
					<Switch>
						<Route path='/setup/project'>
							<Project />
						</Route>

						<Route path='/setup/user'>
							<User />
						</Route>

						<Redirect from='/setup' to='/setup/project' />
					</Switch>
				</Content>
			</Wrapper>
		</Main>
	)
}


export let Header = () => {
	return (
		<HeaderWrapper>
			<h1>Setup</h1>
		</HeaderWrapper>
	)
}

export let Wrapper = styled.div`
	display: flex;
	justify-content: center;
	padding-top: calc(var(--baseline) * 21 - var(--baseline-5));
`

export let Content = styled.div`
	background: var(--color-header);
	width: calc(var(--baseline) * 50);
	min-height: calc(var(--baseline) * 30);
	border-radius: var(--baseline);
	box-shadow: var(--shadow-5);
	padding: var(--baseline-2);
`