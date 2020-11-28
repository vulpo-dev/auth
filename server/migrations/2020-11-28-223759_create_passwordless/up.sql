-- Your SQL goes here

create table if not exists passwordless
	( id uuid primary key default uuid_generate_v4()
	, created_at timestamptz not null default now()
	, user_id uuid
	, email text not null
	, token text not null
	, is_valid boolean not null default True
	, project_id uuid references projects(id) on delete cascade
	);