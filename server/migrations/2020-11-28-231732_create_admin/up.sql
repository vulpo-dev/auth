-- Your SQL goes here
-- Your SQL goes here

create table if not exists admins
	( id uuid primary key default uuid_generate_v4()
	, password text
	, email text unique not null
	, traits text[] not null default '{}'
	, created_at timestamptz not null default now()
	, updated_at timestamptz not null default now()
	);

create unique index admin_email_idx on admins (email);

select diesel_manage_updated_at('admins');