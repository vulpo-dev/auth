import { Previews, Item } from "postler";
import { faker } from "@faker-js/faker"
import { TemplateProps } from "./types";

export let Data: Previews<TemplateProps> = [
	Item("name", {
		project: "email-templates",
		new_email: faker.internet.email(),
		href: faker.internet.url(),
	}),
	Item("long text", {
		project: faker.company.name(),
		new_email: faker.internet.email(),
		href: faker.internet.url(),
	}),
];
