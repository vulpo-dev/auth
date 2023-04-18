import { GetTranslation, ToTranslations } from "postler";
import { props } from "./types";

export let DefaultTranslation = {
	lang: "en",
	translation: {
		subject: "Reset Password",
		headline: "Reset Password",
		label: "Reset Password",
		text: `Click on the link below to reset your ${props.project} password.`,
		expire: `The link is valid for <span class="bold">${props.expire_in} minutes</span> and can only be used once`
	},
};

export type Translation = GetTranslation<typeof DefaultTranslation>;

export let Translations: ToTranslations<typeof DefaultTranslation> = [
	{
		lang: "de",
		translation: {
			headline: "Passwort zurücksetzen",
			subject: "Passwort zurücksetzen",
			label: "Passwort zurücksetzen",
			text: `Ihr ${props.project} Passwort hat sich geändert. Sie können diese E-Mail ignorieren, wenn Sie gerade Ihr Passwort geändert haben, ansonsten sollten Sie Ihr Passwort zurücksetzen.`,
			expire: `Der Link ist für <span class="bold">${props.expire_in} Minuten</span> gültig und kann nur einmal verwendet werden`
		},
	},
];
