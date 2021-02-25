-- Your SQL goes here

create table if not exists password_change_requests
	( like passwordless including indexes
	) inherits (passwordless);