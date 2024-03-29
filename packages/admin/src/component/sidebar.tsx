import styled from "@emotion/styled";
import ContentLoader from "react-content-loader";
import { useNavigate } from "react-router-dom";
import { CaretDown, Plus } from "@phosphor-icons/react";
import { ReactNode, useState } from "react";

import {
	useMenu,
	Menu,
	MenuDivider,
	MenuItem,
	MenuItemTitle,
} from "werkbank/component/menu";
import { Dialog } from "werkbank/component/dialog";

import { useGetProjectsQuery } from "../data/admin_api";
import { useActiveProject } from "../data/project";
import CreateProject from "./create_project";

type SidebarProps = {
	children: ReactNode;
};

let Sidebar = ({ children }: SidebarProps) => {
	let currentProject = useActiveProject();
	let { data: projects } = useGetProjectsQuery([]);
	let project = projects?.find((p) => p.id === currentProject);
	let { MenuContainer, ref, ...props } = useMenu({ placement: "bottom-end" });
	let navigate = useNavigate();

	let [createDialog, setCreateDialog] = useState(false);

	let handleCreateProject = (projectId: string) => {
		navigate(`/${projectId}/users`);
		setCreateDialog(false);
	};

	return (
		<>
			<Wrapper>
				<Header>
					{project ? (
						<>
							<Title title={project.name} ref={ref} {...props}>
								<span>{project.name}</span>
								<CaretDown size="0.9em" weight="fill" />
							</Title>
							<MenuContainer>
								<Menu icon>
									<MenuItem
										icon={<Plus />}
										onClick={() => setCreateDialog(true)}
									>
										<MenuItemTitle>Create Project</MenuItemTitle>
									</MenuItem>
									<MenuDivider />
									{projects?.map((project) => {
										return (
											<MenuItem
												key={project.id}
												onClick={() => navigate(`/${project.id}`)}
											>
												<MenuItemTitle>{project.name}</MenuItemTitle>
											</MenuItem>
										);
									})}
								</Menu>
							</MenuContainer>
						</>
					) : (
						<LoadingTitle />
					)}
				</Header>
				{children}
			</Wrapper>

			<Dialog open={createDialog} onClose={() => setCreateDialog(false)}>
				<CreateProject onCreate={handleCreateProject} />
			</Dialog>
		</>
	);
};

export default Sidebar;

let LoadingTitle = () => {
	return (
		<ContentLoader
			viewBox="0 0 218 28"
			style={{ width: "100%", height: 28, display: "block" }}
			backgroundColor="var(--gray-2)"
			foregroundColor="var(--gray-4)"
		>
			<rect width="148" height="28" />
		</ContentLoader>
	);
};

let Wrapper = styled.div`
	color-scheme: light;
	--_spacing-block: var(--size-2);
	--_spacing-inline: var(--size-3);
	--border: 1px solid #222;
	--text-color: #000;

	--button-bg: #fff;
	--button-border: #1a1a1a;
	--button-color: #000;
	--button-bg--hover: #1a1a1a;

	color: var(--text-color);
`;

let Header = styled.header`
	padding: var(--_spacing-block) var(--_spacing-inline);
	border-bottom: var(--border);
	height: var(--size-8, 40px);
	display: flex;
	align-items: center;
`;

let Title = styled.button`
	padding: 0;
	width: 100%;
	border: none;
	outline: none;
	background: none;
	text-align: left;
	font-size: var(--font-size-2);
	font-weight: 700;
	position: relative;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: var(--size-1);
	cursor: pointer;

	span {
		display: block;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	svg {
		flex-shrink: 0;
	}
`;
