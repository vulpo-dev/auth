create table if not exists verify_email
	( like passwordless including indexes
	) inherits (passwordless);
