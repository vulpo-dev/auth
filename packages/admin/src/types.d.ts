import "redux-thunk/extend-redux";

declare global {
	interface Window {
		VULPO_ADMIN_ID: string;
		VULPO_ADMIN_BASE_URL?: string;
	}
}
