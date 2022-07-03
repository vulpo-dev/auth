-- Your SQL goes here

create table if not exists oauth
	( project_id uuid not null references projects(id) on delete cascade
	, provider text not null
	, settings jsonb not null
	, created_at timestamptz not null default now()
	, unique (project_id, provider)
	);

create index oauth_project_id_idx on oauth(project_id);
create index oauth_provider_idx on oauth(provider);


create table if not exists oauth_data
	( provider_id text primary key
	, provider text not null
	, email text
	, user_id uuid not null references users(id) on delete cascade
	, project_id uuid not null references projects(id) on delete cascade
	, unique (provider_id, provider, project_id, user_id)
	);


create table if not exists oauth_request_state
	( request_id uuid primary key default uuid_generate_v4()
	, project_id uuid not null references projects(id) on delete cascade
	, csrf_token text not null
	, pkce_code_verifier text
	, created_at timestamptz not null default now()
	);
