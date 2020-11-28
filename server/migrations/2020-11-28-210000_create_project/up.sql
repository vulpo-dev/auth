-- Your SQL goes here

create table if not exists projects
	( id uuid primary key default uuid_generate_v4()
	, created_at timestamptz not null default now()
	, name text not null
	, email text not null
	, updated_at timestamptz not null default now()
	);

select diesel_manage_updated_at('projects');
