import { createProps } from "postler";

export type TemplateProps = {
	expire_in: number;
	project: string;
	href: string;
	old_email: string;
	new_email: string;
};

export let props = createProps<TemplateProps>();
