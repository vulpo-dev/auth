import styled from "@emotion/styled";
import { Flow } from "werkbank/component/loading";

import {
	PageContent,
	PageHeader,
	PageTitle,
	PageWrapper,
} from "../../component/page";
import adminApi, { useGetProjectsQuery } from "../../data/admin_api";
import { useActiveProject } from "../../data/project";

import ProjectSettings from "./component/project";
import EmailSettings from "./component/email";
import PublicKeysSettings from "./component/public_keys";
import DeleteProject from "./component/delete";
import { Gear } from "@phosphor-icons/react";
import { useCallback, useEffect } from "react";

export function usePrefetchSettings() {
	let prefetchEmailSettings = adminApi.usePrefetch("getEmailSettings");
	let prefetchKeys = adminApi.usePrefetch("getPublicKeys");

	return useCallback((project: string) => {
		prefetchEmailSettings([project]);
		prefetchKeys([project]);
	}, []);
}

export let SettingsPage = () => {
	let activeProject = useActiveProject();
	let projects = useGetProjectsQuery([]);
	let prefetch = usePrefetchSettings();

	useEffect(() => {
		prefetch(activeProject);
	}, [prefetch]);

	if (projects.data === undefined) {
		return (
			<PageWrapper>
				<PageHeader>
					<PageTitle>
						<Gear size="1.2em" />
						<span>Settings</span>
					</PageTitle>
				</PageHeader>

				<StyledPageContent
					style={{ display: "flex", justifyContent: "flex-start" }}
				>
					<Flow size="var(--size-8)" />
				</StyledPageContent>
			</PageWrapper>
		);
	}

	let project = projects.data.find((project) => project.id === activeProject);

	if (project === undefined) {
		return <p>Project {activeProject} not found</p>;
	}

	return (
		<PageWrapper>
			<PageHeader>
				<PageTitle>
					<Gear size="1.2em" />
					<span>Settings</span>
				</PageTitle>
			</PageHeader>
			<StyledPageContent>
				<ProjectSettings project={project} />
				<EmailSettings project={project.id} />
				<PublicKeysSettings project={project.id} />

				{project.is_admin === false && <DeleteProject project={project} />}
			</StyledPageContent>
		</PageWrapper>
	);
};

let StyledPageContent = styled(PageContent)`
	padding: var(--size-8);
	display: flex;
	flex-direction: column;
	align-items: center;
`;
