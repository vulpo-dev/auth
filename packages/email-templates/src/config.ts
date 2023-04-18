// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

export default {
	smtp: {
		host: process.env.SMTP_HOST,
		port: 587,
		secure: false,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASSWORD,
		},
	},
	email: {
		from: process.env.FROM_EMAIL,
	},
};
