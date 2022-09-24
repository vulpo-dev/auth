-- Your SQL goes here

create table if not exists sessions
	( id uuid primary key default uuid_generate_v4()
	, expire_at timestamptz not null default now() + '30 days'
	, project_id uuid not null references projects(id) on delete cascade
	, created_at timestamptz not null default now()
	, public_key bytea not null
	, user_id uuid references users(id) on delete cascade
	);

create index if not exists session_project_idx on sessions(project_id);
