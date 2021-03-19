-- Your SQL goes here

create table if not exists project_keys
	( id uuid primary key default uuid_generate_v4()
	, project_id uuid not null references projects(id) on delete cascade
	, public_key bytea not null
	, private_key bytea not null
	, is_active boolean not null default false
	, expire_at timestamptz
	, created_at timestamptz not null default now()
	);

create index if not exists project_key_idx on project_keys(project_id);
