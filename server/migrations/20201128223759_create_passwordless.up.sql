-- Your SQL goes here

create table if not exists passwordless
	( id uuid primary key default uuid_generate_v4()
	, created_at timestamptz not null default now()
	, expire_at timestamptz not null default now() + '30 minutes'
	, user_id uuid references users(id) on delete cascade
	, email text not null
	, token text not null
	, is_valid boolean not null default True
	, project_id uuid not null references projects(id) on delete cascade
	, confirmed boolean not null default False
	, session_id uuid not null references sessions(id) on delete cascade
	);

create index passwordless_project_idx on passwordless(project_id);
create index passwordless_email_idx on passwordless(email);
create index passwordless_user_idx on passwordless(user_id);
