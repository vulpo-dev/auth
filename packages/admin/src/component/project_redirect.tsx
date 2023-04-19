import { useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGetProjectsQuery } from "../data/admin_api";
import { isUuid, useCurrentProject } from "../data/project";

import { useAuthStateChange } from "@vulpo-dev/auth-react";

let ProjectRedirect = () => {
	let projectId = useCurrentProject();
	let { data: projects } = useGetProjectsQuery([]);
	let navigate = useNavigate();

	let mounted = useRef(true);
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	});

	useAuthStateChange((session) => {
		if (mounted.current && session === null) {
			navigate("auth/", { replace: true });
		}
	});

	if (projectId === "project") {
		return null;
	}

	let validUuid = isUuid.test(projectId ?? "");
	let project = projects?.at(0);
	if (!validUuid && project) {
		return <Navigate to={`/${project.id}`} replace />;
	}

	return null;
};

export default ProjectRedirect;
