-- Your SQL goes here

create table if not exists tokens
	( id uuid primary key default uuid_generate_v4()
	, expire timestamptz not null default now() + interval '1 month' * 3
	, project_id uuid references projects(id) on delete cascade
	, created_at timestamptz not null default now()
	);

create index if not exists token_project_idx on tokens(project_id);

create table if not exists token_user
	( id uuid primary key default uuid_generate_v4()
	, token_id uuid not null references tokens(id) on delete cascade
	, user_id uuid references users(id) on delete cascade
	);

create index if not exists token_user_token_idx on token_user(token_id);