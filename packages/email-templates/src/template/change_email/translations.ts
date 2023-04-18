import { GetTranslation, ToTranslations } from "postler";
import { props } from "./types";

export let DefaultTranslation = {
	lang: "en",
	translation: {
		subject: "Email Change Requested",
		headline: "Email Change Requested",
		label: "Reset Email",
		text: `A new email address (${props.new_email}) has been requested for your ${props.project} account. If you haven't requested the change, you can reset you email by clicking on the link below, otherwise you can ignore this email.`
	},
};

export type Translation = GetTranslation<typeof DefaultTranslation>;

export let Translations: ToTranslations<typeof DefaultTranslation> = [
	{
		lang: "de",
		translation: {
			headline: "E-Mail-Änderung angefordert",
			subject: "E-Mail-Änderung angefordert",
			label: "E-Mail zurücksetzen",
			text: `Eine neue E-Mail-Adresse (${props.new_email}) wurde für Ihr ${props.project} Konto angefordert. Wenn Sie die Änderung nicht angefordert haben, können Sie Ihre E-Mail zurücksetzen, indem Sie auf den unten stehenden Link klicken, ansonsten können Sie diese E-Mail ignorieren.`
		},
	},
];
