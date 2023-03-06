import { useMatches } from "react-router-dom";

// https://stackoverflow.com/a/38191104
export let isUuid = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);

export function useCurrentProject(): string | null {
	let matches = useMatches();
	let match = matches.find(match => {
		return match.params.projectId
	});

	let id = match?.params?.projectId;

	if (!id) {
		return null;
	}

	return id;
}

export function useActiveProject(): string {
	let projectId = useCurrentProject();

	if (!projectId) {
		throw new Error("useActiveProject used outside of project route");
	}

	return projectId;
}