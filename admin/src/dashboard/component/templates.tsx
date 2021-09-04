import React from 'react'
import { useState, FunctionComponent, ChangeEvent } from 'react'
import styled from 'styled-components'
import { SidebarLayout, Aside, Main } from '@biotic-ui/layout'
import { Link, useLocation, useRouteMatch, Redirect } from 'react-router-dom'
import { Location } from 'history'
import { useProject } from 'data/project'
import { TemplateType, isTemplate, useTemplate, useSaveTemplate } from 'data/template'
import { Button, LinkButton } from '@biotic-ui/button'
import { useQueryParams } from '@biotic-ui/std'
import { Section, Label, Input, Textarea } from '@biotic-ui/input'

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
	let match = useRouteMatch<{ project: string; template: string }>('/:project/templates/:template')
	let [project] = useProject()
	let currentTab = params.get('tab') ?? Tab.Template

	function navigate(tab: Tab) {
		return (location: Location) => {
			let search = new URLSearchParams(location.search)
			search.set('tab', tab)
			return {
				...location,
				search: search.toString(),
			}
		}
	}

	return (
		<Wrapper>
			<SidebarLayout>
				<Aside drawer='(max-width: 900px)' open={open} onClose={() => setOpen(false)}>
					<TemplateList />
				</Aside>
				<Main>
					{ (match && isTemplate(match.params.template)) &&
						<TemplateCtx.Provider value={{ project: project.id, template: match.params.template }}>						
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
											template={match.params.template}
										/>
									}

									{ currentTab === Tab.Translations &&
										<Translations

										/>
									}
								</Content>
							</Layout>
						</TemplateCtx.Provider>
					}

					{ (!match || !isTemplate(match.params.template)) &&
						<Redirect to={`/${project.id}/templates/${TemplateType.Passwordless}`} />
					}
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
