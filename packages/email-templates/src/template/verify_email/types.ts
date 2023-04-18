import { createProps } from "postler";

export type TemplateProps = {
	project: string;
	href: string;
	expire_in: number;
};

export let props = createProps<TemplateProps>();
