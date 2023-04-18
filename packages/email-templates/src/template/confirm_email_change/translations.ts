import { GetTranslation, ToTranslations } from "postler";
import { props } from "./types";

export let DefaultTranslation = {
	lang: "en",
	translation: {
		subject: "Confirm Email Change",
		headline: "Confirm Email Change",
		label: "Confirm Email Change",
		text: `Click on the link below to verify your changed email address from ${props.old_email} to ${props.new_email}.`,
		expire: `The link is valid for <span class="bold">${props.expire_in} minutes</span> and can only be used once`,
	},
};

export type Translation = GetTranslation<typeof DefaultTranslation>;

export let Translations: ToTranslations<typeof DefaultTranslation> = [
	{
		lang: "de",
		translation: {
			headline: "Bestätigen der E-Mail-Änderung",
			subject: "Bestätigen der E-Mail-Änderung",
			label: "E-Mail Ändern",
			text: `Klicken Sie auf den untenstehenden Link, um Ihre geänderte E-Mail-Adresse von ${props.old_email} auf ${props.new_email} zu verifizieren.`,
			expire: `Der Link ist für <span class="bold">${props.expire_in} Minuten</span> gültig und kann nur einmal verwendet werden`
		},
	},
];
