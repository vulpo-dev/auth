import React from 'react'
import { Fragment } from 'react'
import styled from 'styled-components'
import { Header } from 'component/layout'
import CreateProjectForm from 'component/create_project'
import { useNavigate } from 'react-router-dom'
import { PartialProject } from 'data/project'

export let CreateProject = () => {
	let navigate = useNavigate()

	function handleSuccess(project: PartialProject) {
		navigate(`/${project.id}`, { replace: true })
	}

	return (
		<Fragment>
			<Header>
				<h1>Create Project</h1>
			</Header>
			<Wrapper>
				<Content>
					<StyledCreateProject onSuccess={handleSuccess} />
				</Content>
			</Wrapper>
		</Fragment>
	)
}

export default CreateProject

let StyledCreateProject = styled(CreateProjectForm)`
	padding: 0;
`

let Wrapper = styled.div`
	display: flex;
	justify-content: center;
	padding-top: calc(var(--baseline) * 21 - var(--baseline-5));
`

let Content = styled.div`
	background: var(--color-header);
	width: calc(var(--baseline) * 50);
	min-height: calc(var(--baseline) * 30);
	border-radius: var(--baseline);
	box-shadow: var(--shadow-5);
	padding: var(--baseline-2);
`