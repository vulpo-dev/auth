import { createProps } from "postler";

export type TemplateProps = {
	project: string;
	href: string;
};

export let props = createProps<TemplateProps>();
