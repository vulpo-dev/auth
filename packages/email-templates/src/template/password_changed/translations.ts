import { GetTranslation, ToTranslations } from "postler";
import { props } from "./types";

export let DefaultTranslation = {
	lang: "en",
	translation: {
		subject: "Password Changed",
		headline: "Password Changed",
		label: "Reset Password",
		text: `Your ${props.project} password has changed. You can ignore this email if you just changed your password, otherwise you should reset your password.`,
	},
};

export type Translation = GetTranslation<typeof DefaultTranslation>;

export let Translations: ToTranslations<typeof DefaultTranslation> = [
	{
		lang: "de",
		translation: {
			headline: "Ihr Passwort wurde geändert",
			subject: "Ihr Passwort wurde geändert",
			label: "Passwort zurücksetzen",
			text: `Ihr ${props.project} Passwort hat sich geändert. Sie können diese E-Mail ignorieren, wenn Sie gerade Ihr Passwort geändert haben, ansonsten sollten Sie Ihr Passwort zurücksetzen.`,
		},
	},
];
