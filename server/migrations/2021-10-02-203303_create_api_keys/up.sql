-- Your SQL goes here

create table if not exists api_keys
	( id uuid primary key default uuid_generate_v4()
	, token text not null
	, name text
	, user_id uuid not null references users(id) on delete cascade
	, project_id uuid not null references projects(id) on delete cascade
	, expire_at timestamptz
	, created_at timestamptz not null default now()
	);