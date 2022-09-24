-- Your SQL goes here

create table if not exists projects
	( id uuid primary key default uuid_generate_v4()
	, created_at timestamptz not null default now()
	, updated_at timestamptz not null default now()
	, is_admin boolean not null default False
	, flags text[] not null default '{}'
	);

select diesel_manage_updated_at('projects');
