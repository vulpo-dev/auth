import { useMemo } from "react";
import { useMatches } from "react-router-dom";
import * as uuid from "uuid";

export function useValidateUuid(id?: string | null): boolean {
	return useMemo(() => (id ? uuid.validate(id) : false), [id]);
}

export function useMatchedUserId() {
	let matches = useMatches();
	let match = matches.find((match) => match.id === "user-detail");
	let userId = match?.params.userId;
	let validUuid = useValidateUuid(userId);
	return userId && validUuid ? userId : null;
}
