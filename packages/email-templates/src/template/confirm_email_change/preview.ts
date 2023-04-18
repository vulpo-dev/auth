import { Previews, Item } from "postler";
import { faker } from "@faker-js/faker"
import { TemplateProps } from "./types";

export let Data: Previews<TemplateProps> = [
	Item("name", {
		project: "email-templates",
		old_email: faker.internet.email(),
		new_email: faker.internet.email(),
		href: faker.internet.url(),
		expire_in: 15,
	}),
	Item("long text", {
		project: faker.company.name(),
		old_email: faker.internet.email(),
		new_email: faker.internet.email(),
		href: faker.internet.url(),
		expire_in: 120,
	}),
];
