-- Your SQL goes here

create table if not exists projects
	( id uuid primary key default uuid_generate_v4()
	, name text unique not null
	, created_at timestamptz not null default now()
	, updated_at timestamptz not null default now()
	, is_admin boolean not null default False
	);

select diesel_manage_updated_at('projects');
