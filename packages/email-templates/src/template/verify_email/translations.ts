import { GetTranslation, ToTranslations } from "postler";
import { props } from "./types";

export let DefaultTranslation = {
	lang: "en",
	translation: {
		subject: "Verify Email",
		headline: "Verify Email",
		label: "Verify Email",
		text: `Click on the link below to verify your ${props.project} account.`,
		expire: `The link is valid for <span class="bold">${props.expire_in} minutes</span> and can only be used once`
	},
};

export type Translation = GetTranslation<typeof DefaultTranslation>;

export let Translations: ToTranslations<typeof DefaultTranslation> = [
	{
		lang: "de",
		translation: {
			headline: "E-Mail verifizieren",
			subject: "E-Mail verifizieren",
			label: "E-Mail verifizieren",
			text: `Klicken Sie auf den untenstehenden Link, um Ihr ${props.project} Konto zu verifizieren`,
			expire: `Der Link ist für <span class="bold">${props.expire_in} Minuten</span> gültig und kann nur einmal verwendet werden`
		},
	},
];
