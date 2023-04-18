import { GetTranslation, ToTranslations } from "postler";
import { props } from "./types";

export let DefaultTranslation = {
	lang: "en",
	translation: {
		subject: "Sign In",
		headline: "Sign In",
		label: "Sign In",
		text: `Click on the link below to sign in to your ${props.project} account.`,
		expire: `The link is valid for <span class="bold">${props.expire_in} minutes</span> and can only be used once`
	},
};

export type Translation = GetTranslation<typeof DefaultTranslation>;

export let Translations: ToTranslations<typeof DefaultTranslation> = [
	{
		lang: "de",
		translation: {
			headline: "Anmelden",
			subject: "Anmelden",
			label: "Anmelden",
			text: `Klicken Sie auf den untenstehenden Link, um sich bei Ihrem ${props.project} Konto anzumelden`,
			expire: `Der Link ist für <span class="bold">${props.expire_in} Minuten</span> gültig und kann nur einmal verwendet werden`
		},
	},
];
