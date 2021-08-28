-- Your SQL goes here

create table if not exists refresh_access_tokens
	( id uuid primary key
	, session_id uuid not null references sessions(id) on delete cascade
	, expire_at timestamptz not null default now() + '30 minutes'
	);