import { Previews, Item } from "postler";
import { faker } from "@faker-js/faker"
import { TemplateProps } from "./types";

export let Data: Previews<TemplateProps> = [
	Item("name", {
		project: "email-templates",
		href: faker.internet.url(),
		expire_in: 15,
	}),
	Item("long text", {
		project: faker.company.name(),
		href: faker.internet.url(),
		expire_in: 120,
	}),
];
