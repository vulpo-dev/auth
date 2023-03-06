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
		}
	});

	let validUuid = isUuid.test(projectId ?? "");
	let project = projects?.at(0);

	useAuthStateChange((session) => {
		console.log("ProjectRedirect: ", { session })
		if (mounted.current && session === null) {
			navigate('auth/')
		}
	});
	 
	if (!validUuid && project) {
		return <Navigate to={`/${project.id}`} />
	}

	return null;
}

export default ProjectRedirect;
