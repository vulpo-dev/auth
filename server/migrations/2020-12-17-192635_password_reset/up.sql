-- Your SQL goes here

create table if not exists password_change_requests
	( id uuid primary key default uuid_generate_v4()
	, created_at timestamptz not null default now()
	, user_id uuid not null references users(id) on delete cascade
	, token text not null
	, project_id uuid not null references projects(id) on delete cascade
	);

create index password_change_requests_user_idx on password_change_requests(user_id);
