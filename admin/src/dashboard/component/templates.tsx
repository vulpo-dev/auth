import React, { useMemo } from 'react'
import { useState } from 'react'
import styled from 'styled-components'
import { SidebarLayout, Aside, Main } from '@biotic-ui/layout'
import { Link, useLocation, useMatch, Navigate, Route } from 'react-router-dom'
import { useProject } from 'data/project'
import { TemplateType, isTemplate } from 'data/template'
import { useQueryParams } from '@biotic-ui/std'

import { TemplateForm } from 'templates/form'
import { TemplateList } from 'templates/list'
import { Translations } from 'templates/translations'
import { TemplateCtx } from 'templates/ctx'

enum Tab {
	Template = 'template',
	Translations = 'translations'
}

let Templates = () => {
	let [open, setOpen] = useState(true)
	let location = useLocation()
	let params = useQueryParams(location.search)
	let match = useMatch('/:project/templates/:template/*')
	let [project] = useProject()
	let currentTab = params.get('tab') ?? Tab.Template
	let search = useMemo(() => {
		return new URLSearchParams(location.search)
	}, [location.search])

	function navigate(tab: Tab) {
			search.set('tab', tab)
		return {
			...location,
			search: search.toString(),
		}
	}

	let template = match?.params.template as TemplateType

	console.log('FFUFUUUFUUU', { match })

	if (!match || !isTemplate(template)) {
		return <Navigate to={`/${project.id}/templates/${TemplateType.Passwordless}`} />
	}

	return (
		<Wrapper>
			<SidebarLayout>
				<Aside drawer='(max-width: 900px)' open={open} onClose={() => setOpen(false)}>
					<TemplateList />
				</Aside>
				<Main>
					<TemplateCtx.Provider value={{ project: project.id, template }}>						
						<Layout>
							<TemplateNav>
								<StyledListItem
									$isActive={currentTab === Tab.Template}
									to={navigate(Tab.Template)}
								>
									Template
								</StyledListItem>

								<StyledListItem
									$isActive={currentTab === Tab.Translations}
									to={navigate(Tab.Translations)}
								>
									Translations
								</StyledListItem>
							</TemplateNav>

							<Content>
								{ currentTab === Tab.Template &&
									<TemplateForm
										project={project.id}
										template={template}
									/>
								}

								{ currentTab === Tab.Translations &&
									<Translations />
								}
							</Content>
						</Layout>
					</TemplateCtx.Provider>
				</Main>
			</SidebarLayout>
		</Wrapper>
	)
}

export default Templates

let Wrapper = styled.div`
	--drawer-background: var(--color-background);
	--aside-background: none;
	height: 100%;

	--template-nav-height: var(--baseline-5);

`

let Content = styled.div`
	display: flex;

	@media screen and (min-width: 1330px) {
		margin-left: -250px;
	}
`

let Layout = styled.div`
	display: grid;
	grid-template-rows: var(--template-nav-height) auto;
	height: 100%;
`

let TemplateNav = styled.nav`
	display: flex;
	align-items: center;
	justify-content: center;
	column-gap: var(--baseline-5);
	margin-left: -250px;
`

let StyledListItem = styled(Link)<{ $isActive?: boolean }>`
	font-size: calc(var(--baseline) * 2.5);
	line-height: 1;
	margin-bottom: 0;

	color: inherit;
	text-decoration: none;

	${p => p.$isActive && `
		text-decoration: underline;
		text-decoration-color: var(--pink);
		text-decoration-thickness: 3px;
	`}
`
