import { createProps } from "postler";

export type TemplateProps = {
	new_email: string;
	project: string;
	href: string;
};

export let props = createProps<TemplateProps>();
