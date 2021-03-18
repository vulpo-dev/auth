
create table if not exists project_settings
	( project_id uuid primary key references projects(id) on delete cascade
	, name text unique not null
	, domain text not null
	);


create table if not exists email_settings
	( project_id uuid primary key references projects(id) on delete cascade
	, from_name text not null
	, from_email text not null
	, password text not null
	, username text not null
	, port integer not null
	, host text not null
	);